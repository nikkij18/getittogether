'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardPaste, Paperclip, X } from 'lucide-react';
import { TextDisperse } from '@/components/ui/text-disperse';
import MorphingArrowButton from '@/components/ui/morphing-arrow-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Typewriter } from '@/components/ui/typewriter';
import { ScribbleBg } from '@/components/ui/scribble-bg';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PRIORITIES, TIME_STOPS, agedUrgency, isFinished, nextAction, normalizeTask, rankTasks, timeLabel,
} from '@/lib/priority';
import type { Priority, SavedTask, Step } from '@/lib/priority';
import { DEFAULT_STEP_MODEL, modelName } from '@/lib/ai-model';

interface ArchivedTask {
  id: string;
  task: string;
  stepCount: number;
  completedAt: number;
}

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-600',
  low: 'text-emerald-500',
};

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const MAX_PASTED_CHARS = 20_000;

const FILE_ERRORS: Record<string, string> = {
  files_too_large: 'Those files are over 4 MB combined. Remove one or use smaller files.',
  too_many_files: `You can attach up to ${MAX_FILES} files.`,
  unsupported_file: 'Use PDF, Word (.docx), or text files.',
  unreadable_file: "The text couldn't be read. If it's a scan, try a copy with selectable text.",
  pasted_too_long: `Pasted text can be up to ${MAX_PASTED_CHARS.toLocaleString()} characters.`,
};

class StepsError extends Error {
  constructor(public code: string, public fileName?: string) {
    super(code);
  }
}

function fileProblemMessage(error: unknown): string | null {
  if (!(error instanceof StepsError) || !FILE_ERRORS[error.code]) return null;
  return error.fileName ? `${error.fileName}: ${FILE_ERRORS[error.code]}` : FILE_ERRORS[error.code];
}

async function requestSteps(task: string, urgency: Priority, minutes: number, files: File[], pasted: string, signal?: AbortSignal) {
  const body = new FormData();
  body.set('task', task);
  body.set('urgency', urgency);
  body.set('minutes', String(minutes));
  files.forEach(file => body.append('file', file));
  if (pasted.trim()) body.set('notes', pasted.trim());

  const response = await fetch('/api/steps', { method: 'POST', body, signal });
  const data: { steps?: Step[]; truncated?: string[]; model?: string; error?: string; file?: string } = await response.json().catch(() => ({}));
  if (!response.ok || !data.steps) throw new StepsError(data.error ?? 'generation_failed', data.file);
  return { steps: data.steps, truncated: data.truncated ?? [], model: data.model ?? DEFAULT_STEP_MODEL };
}

// ---- Optional files with the task's instructions ----
function FileAttach({ files, onChange, label, error, children }: {
  files: File[];
  onChange: (files: File[], problem: string | null) => void;
  label: string;
  error?: string | null;
  /** Other actions shown on the same row as the attach button. */
  children?: React.ReactNode;
}) {
  const add = (chosen: File[]) => {
    if (chosen.length === 0) return;
    const isNew = (file: File) => !files.some(f => f.name === file.name && f.size === file.size);
    const next = [...files, ...chosen.filter(isNew)];
    if (next.length > MAX_FILES) return onChange(files, FILE_ERRORS.too_many_files);
    if (!chosen.every(file => /\.(pdf|docx|txt|md)$/i.test(file.name))) return onChange(files, FILE_ERRORS.unsupported_file);
    if (next.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) return onChange(files, FILE_ERRORS.files_too_large);
    onChange(next, null);
  };
  return (
    <div>
      {files.length > 0 && (
        <ul className="space-y-1 mb-1.5">
          {files.map(file => (
            <li key={`${file.name}-${file.size}`} className="flex items-center gap-2 text-xs font-bold text-foreground min-w-0">
              <Paperclip size={14} className="flex-shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="truncate">{file.name}</span>
              <button type="button" onClick={() => onChange(files.filter(f => f !== file), null)} aria-label={`Remove ${file.name}`} className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {files.length < MAX_FILES && (
        <label className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
          <Paperclip size={14} aria-hidden="true" />
          {files.length > 0 ? 'add another file' : label}
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="sr-only"
            onChange={e => { add(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          />
        </label>
      )}
      {children}
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-red-500 mt-1">{error}</p>}
    </div>
  );
}


// ---- Dark mode hook ----
function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);
  return { dark, toggle };
}

// ---- Sortable step row wrapper ----
function SortableStep({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex gap-2 items-start group/row"
    >
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
        className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing touch-none"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/>
          <circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </button>
      {children}
    </li>
  );
}

const TASK_SUGGESTIONS = ['file my taxes', 'finish my essay', 'do laundry', 'go to the gym'];

// ---- Single-choice row for urgency ----
function ChoiceRow<T extends string>({ label, options, value, onChange, missing }: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  missing?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <span className={`block text-xs font-bold mb-1.5 ${missing ? 'text-red-500' : 'text-muted-foreground'}`}>
        {missing ? `choose ${label}` : label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-2 rounded-full border-2 text-xs font-bold transition-colors cursor-pointer ${
              value === option.value
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-border bg-card text-foreground hover:border-emerald-400'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Scale slider for expected time ----
function ScaleSlider<T extends string | number>({ label, stops, value, resting, format, onChange, missing }: {
  label: string;
  stops: T[];
  value: T | null;
  /** Where the thumb sits before a value is chosen. It doesn't count as a choice. */
  resting: T;
  format: (value: T) => string;
  onChange: (value: T) => void;
  missing?: boolean;
}) {
  const index = stops.indexOf(value ?? resting);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className={`text-xs font-bold ${missing ? 'text-red-500' : 'text-muted-foreground'}`}>{missing ? `set ${label}` : label}</span>
        <output className="text-xs font-bold tabular-nums text-foreground">{value === null ? 'not set' : format(value)}</output>
      </div>
      <Slider
        min={0}
        max={stops.length - 1}
        step={1}
        value={[index]}
        onValueChange={([next]) => onChange(stops[next])}
        onPointerUp={() => onChange(stops[index])}
        thumbLabel={label}
        thumbValueText={value === null ? 'not set' : format(value)}
        className={`py-2 cursor-pointer [--primary:var(--color-emerald-500)] ${value === null ? 'opacity-50' : ''}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground font-medium" aria-hidden="true">
        <span>{format(stops[0])}</span>
        <span>{format(stops[stops.length - 1])}</span>
      </div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function HomePage() {
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>([]);
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [savedTasks, setSavedTasks] = useState<SavedTask[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [draftTask, setDraftTask] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [urgency, setUrgency] = useState<Priority | null>(null);
  const [expectedMinutes, setExpectedMinutes] = useState<number | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stepsFailed, setStepsFailed] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regenerateFailedId, setRegenerateFailedId] = useState<string | null>(null);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [regenerateFiles, setRegenerateFiles] = useState<{ id: string; files: File[] } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [usedAttachments, setUsedAttachments] = useState<{ names: string[]; truncated: string[] } | null>(null);
  const [pasted, setPasted] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [stepsModel, setStepsModel] = useState<string | null>(null);
  const generateAbort = useRef<AbortController | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [storageLoaded, setStorageLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const { dark, toggle } = useDarkMode();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleReorderPreviewSteps = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parseInt((active.id as string).replace('preview-step-', ''));
    const newIndex = parseInt((over.id as string).replace('preview-step-', ''));
    setSteps(prev => arrayMove(prev, oldIndex, newIndex));
    setCheckedSteps(prev => arrayMove(prev, oldIndex, newIndex));
  }, []);

  const handleReorderSavedSteps = useCallback((taskId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parseInt((active.id as string).split('-step-')[1]);
    const newIndex = parseInt((over.id as string).split('-step-')[1]);
    setSavedTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t,
      steps: arrayMove(t.steps, oldIndex, newIndex),
      checkedSteps: arrayMove(t.checkedSteps, oldIndex, newIndex),
    }));
  }, []);

  // Persist task list + name in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('git-tasklist');
      if (stored) setSavedTasks((JSON.parse(stored) as Record<string, unknown>[]).map(normalizeTask));
      const storedArchive = localStorage.getItem('git-archive');
      if (storedArchive) setArchivedTasks(JSON.parse(storedArchive));
      const storedName = localStorage.getItem('git-username');
      if (storedName) {
        setUserName(storedName);
      } else {
        setShowNamePrompt(true);
      }
      setStorageLoaded(true);
    } catch {
      // Stored data couldn't be read. Leave it in place instead of overwriting it.
    }
  }, []);
  // Aging depends on the clock, so a tab left open still re-ranks.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3_600_000);
    return () => clearInterval(timer);
  }, []);
  // Saving waits until loading has finished, so startup can't overwrite saved tasks.
  useEffect(() => {
    if (storageLoaded) localStorage.setItem('git-tasklist', JSON.stringify(savedTasks));
  }, [savedTasks, storageLoaded]);
  useEffect(() => {
    if (storageLoaded) localStorage.setItem('git-archive', JSON.stringify(archivedTasks));
  }, [archivedTasks, storageLoaded]);

  const handleArchiveTask = useCallback((taskId: string) => {
    const task = savedTasks.find(t => t.id === taskId);
    if (!task) return;
    const completedAt = Date.now();
    setArchivedTasks(prev => [...prev, {
      id: taskId,
      task: task.task,
      stepCount: task.steps.length,
      completedAt,
    }]);
    setSavedTasks(prev => prev.filter(t => t.id !== taskId));
  }, [savedTasks]);

  const handleGenerate = useCallback(async () => {
    const trimmed = task.trim();
    if (generating) return;
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    if (!urgency || expectedMinutes === null) {
      setShowMissing(true);
      return;
    }
    setShowMissing(false);
    setStepsFailed(false);
    setAttachmentError(null);
    setUsedAttachments(null);
    setStepsModel(null);

    let generatedSteps: Step[] = [];
    if (mode === 'auto') {
      const controller = new AbortController();
      generateAbort.current = controller;
      setGenerating(true);
      setShowResults(false);
      try {
        const result = await requestSteps(trimmed, urgency, expectedMinutes, attachments, pasted, controller.signal);
        generatedSteps = result.steps;
        setStepsModel(result.model);
        const sources = [...attachments.map(f => f.name), ...(pasted.trim() ? ['pasted text'] : [])];
        if (sources.length > 0) setUsedAttachments({ names: sources, truncated: result.truncated });
      } catch (error) {
        // Cleared or replaced while the request was running.
        if (controller.signal.aborted) return;
        // A bad file is fixable here, so stay on the form.
        const fileProblem = fileProblemMessage(error);
        if (fileProblem) {
          setAttachmentError(fileProblem);
          setGenerating(false);
          return;
        }
        setMode('custom');
        setStepsFailed(true);
      }
      setGenerating(false);
    }

    setDraftTask(trimmed);
    setSteps(generatedSteps);
    setCheckedSteps(new Array(generatedSteps.length).fill(false));
    setShowResults(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [task, urgency, expectedMinutes, mode, generating, attachments, pasted]);

  const handleAddPreviewStep = useCallback(() => {
    setSteps(prev => [...prev, { text: 'new step', note: null }]);
    setCheckedSteps(prev => [...prev, false]);
  }, []);

  const handleEditPreviewStep = useCallback((idx: number, newText: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, text: newText } : s));
  }, []);

  const handleDeletePreviewStep = useCallback((idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx));
    setCheckedSteps(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleCopy = useCallback(() => {
    const text = steps.map((s, i) => `${i + 1}. ${s.text}`).join('\n');
    navigator.clipboard.writeText(`Steps to: ${draftTask}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [steps, draftTask]);

  const resetDraft = useCallback(() => {
    generateAbort.current?.abort();
    setGenerating(false);
    setStepsFailed(false);
    setAttachments([]);
    setPasted('');
    setShowPaste(false);
    setStepsModel(null);
    setAttachmentError(null);
    setUsedAttachments(null);
    setShowResults(false);
    setTask('');
    setCheckedSteps([]);
    setUrgency(null);
    setExpectedMinutes(null);
    setShowMissing(false);
  }, []);

  const handleNew = useCallback(() => {
    resetDraft();
    setTimeout(() => {
      inputRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, [resetDraft]);

  // Reset the page to its first-visit state. The theme preference is kept.
  const handleClearAll = useCallback(() => {
    setDraftTask('');
    resetDraft();
    setSteps([]);
    setCopied(false);
    setMode('auto');
    setSavedTasks([]);
    setArchivedTasks([]);
    setShowArchive(false);
    setExpandedTasks(new Set());
    setUserName('');
    setNameInput('');
    localStorage.removeItem('git-username');
    setShowClearConfirm(false);
    setShowNamePrompt(true);
    window.scrollTo({ top: 0 });
  }, [resetDraft]);

  const handleSaveTask = useCallback(() => {
    if (!urgency || expectedMinutes === null) return;
    const savedAt = Date.now();
    const newTask: SavedTask = {
      id: savedAt.toString(),
      task: draftTask,
      steps,
      checkedSteps,
      priority: urgency,
      expectedMinutes,
      urgencySetAt: savedAt,
    };
    setSavedTasks(prev => [...prev, newTask]);
    setNow(savedAt);
    resetDraft();
    setTimeout(() => {
      taskListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [draftTask, urgency, expectedMinutes, steps, checkedSteps, resetDraft]);

  // Setting urgency by hand is a reassessment, so the aging clock restarts.
  const handleSetTaskUrgency = useCallback((taskId: string, priority: Priority) => {
    const changedAt = Date.now();
    setNow(changedAt);
    setSavedTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority, urgencySetAt: changedAt } : t));
  }, []);

  const handleRegenerateSteps = useCallback(async (saved: SavedTask) => {
    setRegeneratingId(saved.id);
    setRegenerateFailedId(null);
    setRegenerateError(null);
    try {
      const { urgency: current } = agedUrgency(saved, Date.now());
      const files = regenerateFiles?.id === saved.id ? regenerateFiles.files : [];
      const { steps: newSteps } = await requestSteps(saved.task, current, saved.expectedMinutes, files, '');
      setSavedTasks(prev => prev.map(t => t.id === saved.id
        ? { ...t, steps: newSteps, checkedSteps: new Array(newSteps.length).fill(false) }
        : t));
      setRegenerateFiles(null);
    } catch (error) {
      setRegenerateFailedId(saved.id);
      setRegenerateError(fileProblemMessage(error));
    }
    setRegeneratingId(null);
  }, [regenerateFiles]);

  const handleSetTaskTime = useCallback((taskId: string, minutes: number) => {
    setSavedTasks(prev => prev.map(t => t.id === taskId ? { ...t, expectedMinutes: minutes } : t));
  }, []);

  const handleEditTaskName = useCallback((taskId: string, newName: string) => {
    setSavedTasks(prev => prev.map(t => t.id === taskId ? { ...t, task: newName } : t));
  }, []);

  const handleEditStep = useCallback((taskId: string, stepIdx: number, newText: string) => {
    setSavedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const newSteps = [...t.steps];
      newSteps[stepIdx] = { ...newSteps[stepIdx], text: newText };
      return { ...t, steps: newSteps };
    }));
  }, []);

  const handleToggleSavedStep = useCallback((taskId: string, stepIdx: number) => {
    setSavedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updated = [...t.checkedSteps];
      updated[stepIdx] = !updated[stepIdx];
      return { ...t, checkedSteps: updated };
    }));
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setSavedTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const handleAddStep = useCallback((taskId: string) => {
    setSavedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        steps: [...t.steps, { text: 'New step', note: null }],
        checkedSteps: [...t.checkedSteps, false],
      };
    }));
  }, []);

  const handleDeleteStep = useCallback((taskId: string, stepIdx: number) => {
    setSavedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const newSteps = t.steps.filter((_, i) => i !== stepIdx);
      const newChecked = t.checkedSteps.filter((_, i) => i !== stepIdx);
      return { ...t, steps: newSteps, checkedSteps: newChecked };
    }));
  }, []);

  const rankedTasks = rankTasks(savedTasks, now);
  const finishedTasks = savedTasks.filter(isFinished);
  const next = nextAction(savedTasks, now);

  return (
    <>
      {/* overflow-clip stops the scribble background extending the page past the footer */}
      <div className="relative overflow-clip">
      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="fixed top-14 right-5 z-50 w-9 h-9 rounded-full border border-border bg-card/80 flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:border-primary hover:shadow-lg"
        aria-label="Toggle dark mode"
      >
        <motion.div
          initial={false}
          animate={{ rotate: dark ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </motion.div>
      </button>

      {/* Clear everything */}
      <button
        onClick={() => setShowClearConfirm(true)}
        className="fixed top-[6.5rem] right-5 z-50 w-9 h-9 rounded-full border border-border bg-card/80 flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:border-red-500 hover:text-red-500 hover:shadow-lg"
        aria-label="Clear everything"
        title="Clear everything"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
      </button>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-end gap-10 px-8 py-4">
        <a href="#home" className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Home</a>
        <a href="#input" className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Input</a>
        <a href="#tasks" className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Task List</a>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section id="home" className="relative min-h-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
        {/* Green radial gradient blob — centered, large */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(134,239,172,0.6),rgba(110,231,183,0.35)_40%,transparent_72%)] blur-2xl dark:opacity-35" />
        </div>



        {/* Hero text — shared hover zone, starts scattered, gathers on hover */}
        <div
          className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-14 pb-16 pt-8"
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
        >
          <div className="w-full overflow-visible">
            {userName && (
              <TextDisperse
                scattered={!heroHovered}
                className="text-[9vw] font-bold text-zinc-900 dark:text-zinc-50 tracking-[-0.03em] leading-none select-none [font-family:var(--font-display)]"
              >
                {`${userName},`}
              </TextDisperse>
            )}
            <TextDisperse
              scattered={!heroHovered}
              className="text-[9vw] font-bold text-zinc-900 dark:text-zinc-50 tracking-[-0.03em] leading-none select-none [font-family:var(--font-display)]"
            >
              get it together.
            </TextDisperse>
          </div>

          <motion.p
            className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg font-medium mt-8 max-w-sm"
            animate={{ opacity: heroHovered ? 1 : 0.5 }}
            transition={{ duration: 0.25 }}
          >
            the to-do list that tells you where to start.<br />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">we do the thinking, so you can focus on doing.</span>
          </motion.p>

        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 dark:text-zinc-500">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ===== TASK INPUT SECTION ===== */}
      <section id="input" className="relative isolate min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-background">
        <ScribbleBg />
        <div className="w-full max-w-xl mx-auto relative z-10">
          {/* Input area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="min-h-20 md:min-h-0 text-4xl md:text-5xl font-bold text-foreground text-center mb-4 md:whitespace-nowrap [font-family:var(--font-display)]">
              I need to{' '}
              <Typewriter
                text={TASK_SUGGESTIONS}
                speed={65}
                deleteSpeed={35}
                waitTime={1800}
                cursorChar="..."
                className="text-emerald-500"
                cursorClassName=""
              />
            </div>

            <div className="flex gap-3 p-2 bg-card border-2 border-border rounded-3xl shadow-lg transition-all focus-within:border-emerald-500">
              <input
                ref={inputRef}
                type="text"
                value={task}
                onChange={e => setTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="What needs doing?"
                aria-label="Task"
                maxLength={120}
                className="flex-1 bg-transparent border-none outline-none text-foreground font-semibold px-4 py-3 placeholder:text-muted-foreground/50"
              />
              <MorphingArrowButton onClick={handleGenerate} disabled={generating} />
            </div>

            {/* Urgency and time drive both the ranking and the steps */}
            <div className="mt-4 space-y-3 px-1">
              {mode === 'auto' && (
                <div>
                  <FileAttach
                    files={attachments}
                    label="attach instructions"
                    error={attachmentError}
                    onChange={(files, problem) => { setAttachments(files); setAttachmentError(problem); }}
                  >
                    {!showPaste && (
                      <button
                        type="button"
                        onClick={() => setShowPaste(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ClipboardPaste size={14} aria-hidden="true" />
                        paste text
                      </button>
                    )}
                  </FileAttach>
                  {showPaste && (
                    <div className="mt-2">
                      <textarea
                        autoFocus
                        value={pasted}
                        onChange={e => setPasted(e.target.value)}
                        maxLength={MAX_PASTED_CHARS}
                        rows={5}
                        aria-label="Pasted instructions"
                        placeholder="Paste instructions, a rubric, or notes"
                        className="w-full rounded-xl border-2 border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 placeholder:text-muted-foreground/60"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <button type="button" onClick={() => { setPasted(''); setShowPaste(false); }} className="hover:text-foreground">remove pasted text</button>
                        <span className="tabular-nums">{pasted.length.toLocaleString()} / {MAX_PASTED_CHARS.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional. Up to 5 PDF, Word, or text files (4 MB total), or pasted text. Steps are written by {modelName(DEFAULT_STEP_MODEL)}, through Vercel AI Gateway. Anything you add is sent to the AI provider. This site doesn&apos;t save it.
                  </p>
                </div>
              )}
              <ChoiceRow label="urgency" options={PRIORITIES} value={urgency} onChange={setUrgency} missing={showMissing && !urgency} />
              <ScaleSlider label="expected time" stops={TIME_STOPS} value={expectedMinutes} resting={30} format={timeLabel} onChange={setExpectedMinutes} missing={showMissing && expectedMinutes === null} />
            </div>

            {/* Mode toggle */}
            <div className="flex items-center justify-center gap-1 mt-3 p-1 bg-muted/50 rounded-full w-fit mx-auto">
              <button
                onClick={() => setMode('auto')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'auto' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                generate steps
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'custom' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                write my own
              </button>
            </div>

            {generating && (
              <p role="status" className="text-center text-sm font-semibold text-muted-foreground mt-4">writing steps...</p>
            )}

          </motion.div>

          {/* ===== RESULTS ===== */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                ref={resultsRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="space-y-5"
              >
                {/* Steps card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-card border-2 border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 shadow-lg"
                >
                  <p className="text-foreground font-bold text-base md:text-lg leading-relaxed">{draftTask}</p>
                  {urgency && expectedMinutes !== null && (
                    <p className="text-xs font-bold text-muted-foreground mt-1 mb-5">
                      {urgency}, {timeLabel(expectedMinutes)}
                    </p>
                  )}
                  <div className="border-t border-border mb-4" />
                  {stepsModel && (
                    <p className="text-xs font-medium text-muted-foreground -mt-3 mb-5">Written by {modelName(stepsModel)}.</p>
                  )}
                  {usedAttachments && (
                    <p className="text-xs font-medium text-muted-foreground -mt-3 mb-5">
                      Based on {usedAttachments.names.join(', ')}.
                      {usedAttachments.truncated.length > 0 && ` Only the first part of ${usedAttachments.truncated.join(', ')} was used.`}
                    </p>
                  )}
                  {stepsFailed && (
                    <p role="alert" className="text-sm font-semibold text-foreground mb-3">
                      Steps couldn&apos;t be generated. Write your own below, or switch back to generate steps and try again.
                    </p>
                  )}
                  {steps.length === 0 && mode === 'custom' && !stepsFailed && (
                    <p className="text-muted-foreground text-sm italic text-center py-2">no steps yet. add the first one below.</p>
                  )}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorderPreviewSteps}>
                    <SortableContext items={steps.map((_, i) => `preview-step-${i}`)} strategy={verticalListSortingStrategy}>
                      <ol className="space-y-4">
                        {steps.map((step, i) => {
                          const isChecked = !!checkedSteps[i];
                          return (
                            <SortableStep key={`preview-step-${i}`} id={`preview-step-${i}`}>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(val) => {
                                  const updated = [...checkedSteps];
                                  updated[i] = val === true;
                                  setCheckedSteps(updated);
                                }}
                                className="mt-0.5 flex-shrink-0"
                              />
                              <div className="relative flex-1">
                                <motion.svg
                                  width="100%"
                                  height="32"
                                  viewBox="0 0 340 32"
                                  preserveAspectRatio="none"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-20 w-full h-8"
                                >
                                  <motion.path
                                    d="M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36"
                                    vectorEffect="non-scaling-stroke"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeMiterlimit={10}
                                    fill="none"
                                    animate={{ pathLength: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
                                    transition={{ pathLength: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.01, delay: isChecked ? 0 : 0.8 } }}
                                    className="stroke-zinc-400 dark:stroke-zinc-500"
                                  />
                                </motion.svg>
                                <motion.span
                                  animate={{ opacity: isChecked ? 0.4 : 1 }}
                                  transition={{ duration: 0.3 }}
                                  contentEditable={mode === 'custom'}
                                  suppressContentEditableWarning
                                  onBlur={mode === 'custom' ? (e => handleEditPreviewStep(i, e.currentTarget.textContent || step.text)) : undefined}
                                  className={`text-foreground font-semibold text-sm leading-relaxed block ${mode === 'custom' ? 'outline-none rounded px-1 -mx-1 hover:bg-muted/40 focus:bg-muted/40 cursor-text' : ''}`}
                                >
                                  {step.text}
                                </motion.span>
                                {step.minutes != null && (
                                  <span className="block text-xs text-muted-foreground mt-0.5">{step.minutes} min</span>
                                )}
                              </div>
                              {mode === 'custom' && (
                                <button
                                  onClick={() => handleDeletePreviewStep(i)}
                                  className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 flex-shrink-0 mt-0.5"
                                  aria-label="Delete step"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              )}
                            </SortableStep>
                          );
                        })}
                      </ol>
                    </SortableContext>
                  </DndContext>
                  {mode === 'custom' && (
                    <button
                      onClick={handleAddPreviewStep}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-600 transition-colors font-medium mt-3"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      add step
                    </button>
                  )}
                </motion.div>

                {/* Action buttons / save picker */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={handleCopy} className="flex-1 min-w-fit px-4 py-3 bg-card border-2 border-border rounded-xl text-sm font-bold text-foreground transition-all hover:border-muted-foreground hover:bg-secondary hover:-translate-y-0.5">
                      {copied ? 'copied' : 'copy steps'}
                    </button>
                    <button onClick={handleSaveTask} className="flex-1 min-w-fit px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-transparent rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg hover:-translate-y-0.5">
                      save to list
                    </button>
                    <button onClick={handleNew} className="flex-1 min-w-fit px-4 py-3 bg-card border-2 border-border rounded-xl text-sm font-bold text-foreground transition-all hover:border-muted-foreground hover:bg-secondary hover:-translate-y-0.5">
                      new task
                    </button>
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ===== TASK LIST SECTION ===== */}
      <AnimatePresence>
        {savedTasks.length > 0 && (
          <motion.section
            id="tasks"
            ref={taskListRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="bg-background px-4 py-16"
          >
            <div className="w-full max-w-xl mx-auto space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-medium text-zinc-400 dark:text-zinc-500 tracking-wide">my task list</h2>
                <span className="text-xs font-bold text-muted-foreground">{savedTasks.length} task{savedTasks.length !== 1 ? 's' : ''}</span>
              </div>

              {/* The one thing to do next */}
              {next && (
                <div className="mb-6 p-5 rounded-lg border-2 border-emerald-500 bg-card">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">next action</h3>
                  {next.stepIndex >= 0 ? (
                    <label className="flex gap-3 items-start cursor-pointer">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggleSavedStep(next.task.id, next.stepIndex)}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <span className="font-bold text-foreground text-base leading-snug">{next.task.steps[next.stepIndex].text}</span>
                    </label>
                  ) : (
                    <p className="font-bold text-foreground text-base leading-snug">Add a first step.</p>
                  )}
                  <p className="text-xs text-muted-foreground font-medium mt-2">{next.task.task}. {next.reason}.</p>
                </div>
              )}

              <div className="space-y-2 pt-3">
              {rankedTasks.map(t => {
                const doneCount = t.checkedSteps.filter(Boolean).length;
                const allDone = isFinished(t);
                const aged = agedUrgency(t, now);
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-card border-2 border-border rounded-lg p-5 shadow-sm"
                  >
                    {/* Header */}
                    <button
                      onClick={() => setExpandedTasks(prev => {
                        const next = new Set(prev);
                        next.has(t.id) ? next.delete(t.id) : next.add(t.id);
                        return next;
                      })}
                      className="w-full flex items-start justify-between gap-3 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="relative inline-block max-w-full">
                          <motion.svg
                            width="100%"
                            height="20"
                            viewBox="0 0 340 32"
                            preserveAspectRatio="none"
                            className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-20 w-full"
                          >
                            <motion.path
                              d="M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36"
                              vectorEffect="non-scaling-stroke"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeMiterlimit={10}
                              fill="none"
                              animate={{ pathLength: allDone ? 1 : 0, opacity: allDone ? 1 : 0 }}
                              transition={{ pathLength: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.01, delay: allDone ? 0 : 0.8 } }}
                              className="stroke-zinc-400 dark:stroke-zinc-500"
                            />
                          </motion.svg>
                          <motion.p
                            animate={{ opacity: allDone ? 0.4 : 1 }}
                            transition={{ duration: 0.3 }}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={e => handleEditTaskName(t.id, e.currentTarget.textContent || t.task)}
                            onClick={e => e.stopPropagation()}
                            className="font-bold text-foreground text-sm outline-none cursor-text rounded px-1 -mx-1 hover:bg-muted/40 focus:bg-muted/40"
                          >{t.task}</motion.p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs font-bold ${PRIORITY_COLOR[aged.urgency]}`}>{aged.urgency}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground font-medium">{timeLabel(t.expectedMinutes)}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {doneCount}/{t.steps.length} steps
                          </span>
                          {aged.movedUp && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground font-medium">moved up: waiting {aged.daysWaiting} days</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        <motion.svg
                          animate={{ rotate: expandedTasks.has(t.id) ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </motion.svg>
                        <span
                          onClick={e => { e.stopPropagation(); handleDeleteTask(t.id); }}
                          role="button"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Remove task"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </span>
                      </div>
                    </button>

                    {/* Collapsible content */}
                    <AnimatePresence initial={false}>
                      {expandedTasks.has(t.id) && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-4">
                            <div className="space-y-3">
                              <ChoiceRow label="urgency" options={PRIORITIES} value={aged.urgency} onChange={p => handleSetTaskUrgency(t.id, p)} />
                              <ScaleSlider label="expected time" stops={TIME_STOPS} value={t.expectedMinutes} resting={30} format={timeLabel} onChange={minutes => handleSetTaskTime(t.id, minutes)} />
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                                animate={{ width: `${t.steps.length ? (doneCount / t.steps.length) * 100 : 0}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                              />
                            </div>

                            {/* Checklist with scribble */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleReorderSavedSteps(t.id, e)}>
                              <SortableContext items={t.steps.map((_, i) => `${t.id}-step-${i}`)} strategy={verticalListSortingStrategy}>
                                <ol className="space-y-3">
                                  {t.steps.map((step, i) => {
                                    const isChecked = !!t.checkedSteps[i];
                                    return (
                                      <SortableStep key={`${t.id}-step-${i}`} id={`${t.id}-step-${i}`}>
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={() => handleToggleSavedStep(t.id, i)}
                                          className="mt-0.5 flex-shrink-0"
                                        />
                                        <div className="relative flex-1">
                                          <motion.svg
                                            width="100%"
                                            height="32"
                                            viewBox="0 0 340 32"
                                            preserveAspectRatio="none"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-20 w-full h-8"
                                          >
                                            <motion.path
                                              d="M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36"
                                              vectorEffect="non-scaling-stroke"
                                              strokeWidth={2}
                                              strokeLinecap="round"
                                              strokeMiterlimit={10}
                                              fill="none"
                                              animate={{ pathLength: isChecked ? 1 : 0, opacity: isChecked ? 1 : 0 }}
                                              transition={{ pathLength: { duration: 0.8, ease: 'easeInOut' }, opacity: { duration: 0.01, delay: isChecked ? 0 : 0.8 } }}
                                              className="stroke-zinc-400 dark:stroke-zinc-500"
                                            />
                                          </motion.svg>
                                          <motion.span
                                            animate={{ opacity: isChecked ? 0.4 : 1 }}
                                            transition={{ duration: 0.3 }}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={e => handleEditStep(t.id, i, e.currentTarget.textContent || step.text)}
                                            className="text-foreground font-semibold text-sm leading-relaxed block outline-none cursor-text rounded px-1 -mx-1 hover:bg-muted/40 focus:bg-muted/40"
                                          >
                                            {step.text}
                                          </motion.span>
                                          {step.minutes != null && (
                                            <span className="block text-xs text-muted-foreground mt-0.5">{step.minutes} min</span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => handleDeleteStep(t.id, i)}
                                          className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 flex-shrink-0 mt-0.5"
                                          aria-label="Delete step"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                      </SortableStep>
                                    );
                                  })}
                                </ol>
                              </SortableContext>
                            </DndContext>
                            <button
                              onClick={() => handleAddStep(t.id)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-600 transition-colors font-medium mt-1"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              add step
                            </button>

                            <div className="space-y-2">
                              <FileAttach
                                files={regenerateFiles?.id === t.id ? regenerateFiles.files : []}
                                label="attach instructions"
                                error={regenerateError && regenerateFailedId === t.id ? regenerateError : null}
                                onChange={(files, problem) => {
                                  setRegenerateFiles({ id: t.id, files });
                                  setRegenerateError(problem);
                                  setRegenerateFailedId(problem ? t.id : null);
                                }}
                              />
                              <button
                                onClick={() => handleRegenerateSteps(t)}
                                disabled={regeneratingId === t.id}
                                className="block text-xs text-muted-foreground hover:text-emerald-600 transition-colors font-medium disabled:opacity-50"
                              >
                                {regeneratingId === t.id ? 'writing steps...' : 'regenerate steps'}
                              </button>
                              {regenerateFailedId === t.id && !regenerateError && (
                                <p role="alert" className="text-xs font-semibold text-foreground">Steps couldn&apos;t be generated. Your current steps are unchanged.</p>
                              )}
                            </div>

                            {/* Tasks with no steps can be completed directly */}
                            {(allDone || t.steps.length === 0) && (
                              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                                <button
                                  onClick={() => handleArchiveTask(t.id)}
                                  className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition-colors"
                                >
                                  mark complete
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}

              </div>

              {/* Every step checked, waiting to be marked complete */}
              {finishedTasks.length > 0 && (
                <div className="space-y-2 pt-3">
                  <h3 className="text-xs font-bold text-muted-foreground">all steps done</h3>
                  {finishedTasks.map(t => (
                    <div key={t.id} className="bg-card border-2 border-border rounded-lg p-4 flex items-center justify-between gap-3">
                      <span className="font-bold text-sm text-foreground line-through decoration-zinc-400">{t.task}</span>
                      <button
                        onClick={() => handleArchiveTask(t.id)}
                        className="flex-shrink-0 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition-colors"
                      >
                        mark complete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ===== ARCHIVE SECTION ===== */}
      <AnimatePresence>
        {archivedTasks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="bg-background px-4 pb-16"
          >
            <div className="w-full max-w-xl mx-auto">
              {/* Header — clickable to expand/collapse */}
              <button
                onClick={() => setShowArchive(v => !v)}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-400 dark:text-zinc-500 tracking-wide">completed</span>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold">
                    {archivedTasks.length}
                  </span>
                </div>
                <motion.svg
                  animate={{ rotate: showArchive ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="text-zinc-400 dark:text-zinc-500"
                >
                  <path d="M6 9l6 6 6-6" />
                </motion.svg>
              </button>

              <AnimatePresence initial={false}>
                {showArchive && (
                  <motion.div
                    key="archive-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {/* Stats banner */}
                    <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
                      <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 [font-family:var(--font-display)]">
                        {archivedTasks.length} {archivedTasks.length === 1 ? 'task' : 'tasks'} done
                      </p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 font-medium mt-0.5">
                        {archivedTasks.reduce((sum, t) => sum + t.stepCount, 0)} total steps completed
                      </p>
                    </div>

                    <div className="space-y-1">
                      {[...archivedTasks].reverse().map(t => {
                        const date = new Date(t.completedAt);
                        const now = new Date();
                        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
                        const label = diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                          <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group/arc"
                          >
                            <div className="w-4 h-4 rounded-full border-2 border-emerald-400 dark:border-emerald-600 flex items-center justify-center flex-shrink-0">
                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400"><polyline points="2 6 5 9 10 3"/></svg>
                            </div>
                            <span className="flex-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-600">{t.task}</span>
                            <span className="text-xs text-muted-foreground font-medium">{label}</span>
                            <button
                              onClick={() => setArchivedTasks(prev => prev.filter(a => a.id !== t.id))}
                              className="opacity-0 group-hover/arc:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                              aria-label="Remove from archive"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-sm font-semibold bg-background">
        made with swag, by N2K
      </footer>

      {/* Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-xl text-sm font-bold shadow-xl z-50"
          >
            Steps copied.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CLEAR CONFIRMATION MODAL ===== */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClearConfirm(false)}
            onKeyDown={e => { if (e.key === 'Escape') setShowClearConfirm(false); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="clear-confirm-title"
              aria-describedby="clear-confirm-description"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <h3 id="clear-confirm-title" className="text-2xl font-bold text-foreground mb-2 [font-family:var(--font-display)]">clear everything?</h3>
              <p id="clear-confirm-description" className="text-sm text-muted-foreground mb-6">
                This deletes your current task, saved tasks, completed tasks, and name. You can&apos;t undo this.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  autoFocus
                  onClick={() => setShowClearConfirm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer"
                >
                  cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer"
                >
                  clear everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== NAME PROMPT MODAL ===== */}
      <AnimatePresence>
        {showNamePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-950"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.1, ease: 'easeOut' } }}
              className="w-full max-w-md mx-8 text-center"
            >
              <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-10 [font-family:var(--font-display)]">what should we call you?</h3>
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const name = nameInput.trim();
                    if (name) { setUserName(name); localStorage.setItem('git-username', name); }
                    setShowNamePrompt(false);
                  }
                }}
                placeholder="your name"
                className="w-full bg-transparent border-b-2 border-zinc-200 dark:border-zinc-700 focus:border-emerald-400 outline-none text-foreground text-2xl font-medium text-center py-3 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600 caret-emerald-500 mb-12"
              />
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => setShowNamePrompt(false)}
                  className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  skip
                </button>
                <button
                  onClick={() => {
                    const name = nameInput.trim();
                    if (name) { setUserName(name); localStorage.setItem('git-username', name); }
                    setShowNamePrompt(false);
                  }}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors"
                >
                  continue →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
