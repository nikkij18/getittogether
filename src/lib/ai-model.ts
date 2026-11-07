// The model that writes task steps. All of its providers offer zero data
// retention and don't train on inputs. AI_GATEWAY_MODEL can override it on the server.
export const DEFAULT_STEP_MODEL = 'openai/gpt-4.1-mini-fast';

const MODEL_NAMES: Record<string, string> = {
  'openai/gpt-4.1-mini-fast': 'GPT-4.1 mini by OpenAI',
};

export function modelName(id: string): string {
  return MODEL_NAMES[id] ?? id;
}
