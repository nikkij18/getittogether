# Get It Together

A to-do list that tells you what to do first.

Live site: https://getittogether.vercel.app

Most to-do lists store tasks and leave the hardest decision to you: where to start. Get It Together ranks your tasks and shows one next action.

## How it works

1. Enter a task, choose its urgency, and set its expected time.
2. Optionally attach up to 5 files, such as instructions and a rubric (PDF, Word, or text), then get a short AI-written plan fitted to your time, or write your own.
3. Save the task. The list ranks it and highlights your next action.

### Ranking

Tasks appear as one ranked list, with the next action highlighted at the top. Nothing is assigned to a day: the list only sets the order.

Urgency and expected time place each task in a tier, and tiers come in this order:

| | Up to 10 min | Up to 30 min | Up to 1 hr | Up to 3 hrs | Over 3 hrs |
|---|---|---|---|---|---|
| **Urgent** | 1 | 1 | 1 | 2 | 2 |
| **High** | 1 | 3 | 3 | 2 | 5 |
| **Medium** | 4 | 4 | 5 | 5 | 5 |
| **Low** | 4 | 4 | 6 | 6 | 6 |

Within a tier, higher urgency comes first, then shorter expected time, then the task that has waited longest.

### Aging

A task moves up one urgency level for every 3 days it waits, up to two levels. Low stops at high, and medium can reach urgent. Changing a task's urgency by hand restarts the clock.

## Data and limits

Tasks are stored in your browser's `localStorage`. There are no accounts, and tasks don't sync between browsers or devices.

To generate steps, the task, urgency, expected time, and text from any attached files are sent to an AI provider through Vercel AI Gateway. Files aren't stored by this site. The model's providers offer zero data retention and don't train on this data. Spending has a hard monthly cap, and requests are rate limited per visitor.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Built with

Next.js, React, TypeScript, Tailwind CSS, Framer Motion, dnd-kit, and the Vercel AI SDK. Deployed on Vercel.

The matrix and aging rules are in [`src/lib/priority.ts`](src/lib/priority.ts).
