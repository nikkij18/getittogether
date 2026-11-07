# Get It Together

A to-do list that tells you what to do first.

Live site: https://getittogether.vercel.app

Most to-do lists store tasks and leave the hardest decision to you: where to start. Get It Together ranks your tasks and shows one next action.

## How it works

1. Enter a task, its urgency, and its expected time.
2. Review the steps, edit them, or write your own.
3. Save the task. The list ranks it and highlights your next action.

### Prioritization matrix

Urgency and expected time place each task in one of six groups.

| | 10 min | 30 min | 1 hr | 2 hrs | 5+ hrs |
|---|---|---|---|---|---|
| **Urgent** | Do now | Do now | Do now | Block today | Block today |
| **High** | Do now | Next up | Next up | Block today | This week |
| **Medium** | Batch | Batch | This week | This week | This week |
| **Low** | Batch | Batch | Later | Later | Later |

Groups appear in this order: Do now, Block today, Next up, Batch, This week, Later. Within a group, higher urgency comes first, then shorter time, then the task that has waited longest.

### Aging

A task moves up one urgency level for every 3 days it waits, up to two levels. Low stops at high, and medium can reach urgent. Changing a task's urgency by hand restarts the clock.

## Current status

Steps currently come from prewritten lists matched by keyword. AI-written steps are next.

Tasks are stored in your browser's `localStorage`. There are no accounts, and tasks don't sync between browsers or devices.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Built with

Next.js, React, TypeScript, Tailwind CSS, Framer Motion, and dnd-kit. Deployed on Vercel.

The matrix and aging rules are in [`src/lib/priority.ts`](src/lib/priority.ts).
