import mammoth from 'mammoth';
import { extractText } from 'unpdf';

export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

// Roughly 10 pages across all files. This is what keeps the cost of one request predictable.
const MAX_CHARS = 30_000;

export type FileProblem = 'files_too_large' | 'too_many_files' | 'unsupported_file' | 'unreadable_file';

export class FileError extends Error {
  constructor(public code: FileProblem, public fileName?: string) {
    super(code);
  }
}

async function readText(file: File, bytes: Uint8Array): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Check the file's actual contents as well as its name.
  if (extension === 'pdf') {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new FileError('unreadable_file');
    const { text } = await extractText(bytes, { mergePages: true });
    return text;
  }
  if (extension === 'docx') {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new FileError('unreadable_file');
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return value;
  }
  if (extension === 'txt' || extension === 'md') {
    return new TextDecoder().decode(bytes);
  }
  throw new FileError('unsupported_file');
}

export interface ExtractedDocument {
  name: string;
  text: string;
  truncated: boolean;
}

async function extractOne(file: File): Promise<string> {
  let raw: string;
  try {
    raw = await readText(file, new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    throw error instanceof FileError ? new FileError(error.code, file.name) : new FileError('unreadable_file', file.name);
  }
  const text = raw.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  // A scanned PDF has no text layer, so there's nothing to send.
  if (!text) throw new FileError('unreadable_file', file.name);
  return text;
}

/** Pull the text out of uploads. Files are never stored. */
export async function extractDocuments(files: File[]): Promise<ExtractedDocument[]> {
  if (files.length > MAX_FILES) throw new FileError('too_many_files');
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) throw new FileError('files_too_large');

  const texts = await Promise.all(files.map(extractOne));

  // Share the text limit fairly. Short files keep everything, and whatever they
  // don't use goes to the longer ones.
  const allowance = new Array<number>(texts.length).fill(0);
  let remaining = MAX_CHARS;
  const shortestFirst = texts.map((text, i) => ({ length: text.length, i })).sort((a, b) => a.length - b.length);
  shortestFirst.forEach(({ length, i }, position) => {
    const share = Math.floor(remaining / (shortestFirst.length - position));
    allowance[i] = Math.min(length, share);
    remaining -= allowance[i];
  });

  return files.map((file, i) => ({
    name: file.name.replace(/[^\w .()-]/g, '').slice(0, 80) || `file ${i + 1}`,
    text: texts[i].slice(0, allowance[i]),
    truncated: texts[i].length > allowance[i],
  }));
}