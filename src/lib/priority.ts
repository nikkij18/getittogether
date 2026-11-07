export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TimeEstimate = '10m' | '30m' | '1h' | '2h' | '5h+';
export type GroupId = 'do-now' | 'block-today' | 'next-up' | 'batch' | 'this-week' | 'later';

export interface Step {
  text: string;
  note?: string | null;
}

export interface SavedTask {
  id: string;
  task: string;
  steps: Step[];
  checkedSteps: boolean[];
  priority: Priority;
  timeEstimate: TimeEstimate;
  /** When urgency was last set by hand. Aging counts from here. */
  urgencySetAt: number;
}

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'urgent' },
  { value: 'high', label: 'high' },
  { value: 'medium', label: 'medium' },
  { value: 'low', label: 'low' },
];

export const TIMES: { value: TimeEstimate; label: string }[] = [
  { value: '10m', label: '10 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hr' },
  { value: '2h', label: '2 hrs' },
  { value: '5h+', label: '5+ hrs' },
];

export const GROUP_LABELS: Record<GroupId, string> = {
  'do-now': 'do now',
  'block-today': 'block today',
  'next-up': 'next up',
  batch: 'batch',
  'this-week': 'this week',
  later: 'later',
};

const GROUP_ORDER: GroupId[] = ['do-now', 'block-today', 'next-up', 'batch', 'this-week', 'later'];

const MATRIX: Record<Priority, Record<TimeEstimate, GroupId>> = {
  urgent: { '10m': 'do-now', '30m': 'do-now', '1h': 'do-now', '2h': 'block-today', '5h+': 'block-today' },
  high: { '10m': 'do-now', '30m': 'next-up', '1h': 'next-up', '2h': 'block-today', '5h+': 'this-week' },
  medium: { '10m': 'batch', '30m': 'batch', '1h': 'this-week', '2h': 'this-week', '5h+': 'this-week' },
  low: { '10m': 'batch', '30m': 'batch', '1h': 'later', '2h': 'later', '5h+': 'later' },
};

const URGENCY_ASCENDING: Priority[] = ['low', 'medium', 'high', 'urgent'];
const TIME_ASCENDING: TimeEstimate[] = ['10m', '30m', '1h', '2h', '5h+'];

const DAY_MS = 86_400_000;
const DAYS_PER_LEVEL = 3;
const MAX_LEVELS = 2;

export function groupFor(urgency: Priority, time: TimeEstimate): GroupId {
  return MATRIX[urgency][time];
}

export function timeLabel(time: TimeEstimate): string {
  return TIMES.find(t => t.value === time)?.label ?? time;
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
    TIME_ASCENDING.indexOf(a.timeEstimate) - TIME_ASCENDING.indexOf(b.timeEstimate) ||
    a.urgencySetAt - b.urgencySetAt
  );
}

/** Open tasks in matrix order, grouped. Empty groups are left out; finished tasks are excluded. */
export function groupTasks(tasks: SavedTask[], now: number) {
  return GROUP_ORDER.map(group => ({
    group,
    label: GROUP_LABELS[group],
    tasks: tasks
      .filter(t => !isFinished(t) && groupFor(agedUrgency(t, now).urgency, t.timeEstimate) === group)
      .sort((a, b) => compareTasks(a, b, now)),
  })).filter(g => g.tasks.length > 0);
}

/** The single next thing to do: the first open step of the top-ranked task. */
export function nextAction(tasks: SavedTask[], now: number) {
  const task = groupTasks(tasks, now)[0]?.tasks[0];
  if (!task) return null;

  const stepIndex = task.checkedSteps.findIndex(checked => !checked);
  const stepsLeft = task.checkedSteps.filter(checked => !checked).length;
  const { urgency } = agedUrgency(task, now);
  const parts = [urgency[0].toUpperCase() + urgency.slice(1), timeLabel(task.timeEstimate)];
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
  const timeEstimate = TIMES.some(t => t.value === raw.timeEstimate) ? (raw.timeEstimate as TimeEstimate) : '30m';
  const setAt = Number(raw.urgencySetAt ?? raw.id);

  return {
    id: String(raw.id),
    task: String(raw.task ?? ''),
    steps,
    checkedSteps: steps.map((_, i) => !!checked[i]),
    priority,
    timeEstimate,
    urgencySetAt: Number.isFinite(setAt) && setAt > 0 ? setAt : Date.now(),
  };
}
