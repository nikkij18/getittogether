export type Priority = 'urgent' | 'high' | 'medium' | 'low';
type TimeBand = 'up-to-10m' | 'up-to-30m' | 'up-to-1h' | 'up-to-3h' | 'over-3h';
type GroupId = 'do-now' | 'block-today' | 'next-up' | 'batch' | 'this-week' | 'later';

export interface Step {
  text: string;
  minutes?: number;
  note?: string | null;
}

export interface SavedTask {
  id: string;
  task: string;
  steps: Step[];
  checkedSteps: boolean[];
  priority: Priority;
  expectedMinutes: number;
  /** When urgency was last set by hand. Aging counts from here. */
  urgencySetAt: number;
}

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'urgent' },
  { value: 'high', label: 'high' },
  { value: 'medium', label: 'medium' },
  { value: 'low', label: 'low' },
];

/** Slider stops, in minutes. Closer together at the low end, where small differences matter. */
export const TIME_STOPS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 420, 480];

const GROUP_ORDER: GroupId[] = ['do-now', 'block-today', 'next-up', 'batch', 'this-week', 'later'];

const MATRIX: Record<Priority, Record<TimeBand, GroupId>> = {
  urgent: { 'up-to-10m': 'do-now', 'up-to-30m': 'do-now', 'up-to-1h': 'do-now', 'up-to-3h': 'block-today', 'over-3h': 'block-today' },
  high: { 'up-to-10m': 'do-now', 'up-to-30m': 'next-up', 'up-to-1h': 'next-up', 'up-to-3h': 'block-today', 'over-3h': 'this-week' },
  medium: { 'up-to-10m': 'batch', 'up-to-30m': 'batch', 'up-to-1h': 'this-week', 'up-to-3h': 'this-week', 'over-3h': 'this-week' },
  low: { 'up-to-10m': 'batch', 'up-to-30m': 'batch', 'up-to-1h': 'later', 'up-to-3h': 'later', 'over-3h': 'later' },
};

const URGENCY_ASCENDING: Priority[] = ['low', 'medium', 'high', 'urgent'];
const OLD_TIME_MINUTES: Record<string, number> = { '10m': 10, '30m': 30, '1h': 60, '2h': 120, '5h+': 300 };

const DAY_MS = 86_400_000;
const DAYS_PER_LEVEL = 3;
const MAX_LEVELS = 2;

function timeBand(minutes: number): TimeBand {
  if (minutes <= 10) return 'up-to-10m';
  if (minutes <= 30) return 'up-to-30m';
  if (minutes <= 60) return 'up-to-1h';
  if (minutes <= 180) return 'up-to-3h';
  return 'over-3h';
}

function groupFor(urgency: Priority, minutes: number): GroupId {
  return MATRIX[urgency][timeBand(minutes)];
}

/** "45 min", "1 hr", "1 hr 30 min", "3 hrs". */
export function timeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  const hourText = `${hours} hr${hours === 1 ? '' : 's'}`;
  return rest ? `${hourText} ${rest} min` : hourText;
}

/** Urgency after aging: up one level per 3 days waited, at most two levels, capped at urgent. */
export function agedUrgency(task: SavedTask, now: number) {
  const daysWaiting = Math.max(0, Math.floor((now - task.urgencySetAt) / DAY_MS));
  const start = URGENCY_ASCENDING.indexOf(task.priority);
  const earned = Math.min(MAX_LEVELS, Math.floor(daysWaiting / DAYS_PER_LEVEL));
  const urgency = URGENCY_ASCENDING[Math.min(URGENCY_ASCENDING.length - 1, start + earned)];
  return { urgency, daysWaiting, movedUp: urgency !== task.priority };
}

export function isFinished(task: SavedTask): boolean {
  return task.steps.length > 0 && task.checkedSteps.every(Boolean);
}

function compareTasks(a: SavedTask, b: SavedTask, now: number): number {
  const urgencyA = agedUrgency(a, now).urgency;
  const urgencyB = agedUrgency(b, now).urgency;
  return (
    URGENCY_ASCENDING.indexOf(urgencyB) - URGENCY_ASCENDING.indexOf(urgencyA) ||
    a.expectedMinutes - b.expectedMinutes ||
    a.urgencySetAt - b.urgencySetAt
  );
}

/**
 * Open tasks in one ranked list. The matrix sets the order: each urgency and
 * time combination falls into a tier, and tiers come in a fixed order. Finished
 * tasks are left out.
 */
export function rankTasks(tasks: SavedTask[], now: number): SavedTask[] {
  const tier = (t: SavedTask) => GROUP_ORDER.indexOf(groupFor(agedUrgency(t, now).urgency, t.expectedMinutes));
  return tasks
    .filter(t => !isFinished(t))
    .sort((a, b) => tier(a) - tier(b) || compareTasks(a, b, now));
}
/** The single next thing to do: the first open step of the top-ranked task. */
export function nextAction(tasks: SavedTask[], now: number) {
  const task = rankTasks(tasks, now)[0];
  if (!task) return null;

  const stepIndex = task.checkedSteps.findIndex(checked => !checked);
  const stepsLeft = task.checkedSteps.filter(checked => !checked).length;
  const { urgency } = agedUrgency(task, now);
  const parts = [urgency[0].toUpperCase() + urgency.slice(1), timeLabel(task.expectedMinutes)];
  if (task.steps.length > 0) parts.push(`${stepsLeft} step${stepsLeft === 1 ? '' : 's'} left`);

  return {
    task,
    stepIndex: task.steps.length > 0 ? stepIndex : -1,
    reason: parts.join(', '),
  };
}

/** Bring a task from localStorage up to the current shape. Older saves carry roast and closer text. */
export function normalizeTask(raw: Record<string, unknown>): SavedTask {
  const steps = Array.isArray(raw.steps) ? (raw.steps as Step[]) : [];
  const checked = Array.isArray(raw.checkedSteps) ? (raw.checkedSteps as boolean[]) : [];
  const priority = PRIORITIES.some(p => p.value === raw.priority) ? (raw.priority as Priority) : 'medium';
  const expectedMinutes = typeof raw.expectedMinutes === 'number'
    ? raw.expectedMinutes
    : OLD_TIME_MINUTES[String(raw.timeEstimate)] ?? 30;
  const setAt = Number(raw.urgencySetAt ?? raw.id);

  return {
    id: String(raw.id),
    task: String(raw.task ?? ''),
    steps,
    checkedSteps: steps.map((_, i) => !!checked[i]),
    priority,
    expectedMinutes,
    urgencySetAt: Number.isFinite(setAt) && setAt > 0 ? setAt : Date.now(),
  };
}
