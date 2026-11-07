import type { Step } from './priority';

// Keyword-matched step lists. Temporary: AI-written steps replace this file.
const BREAKDOWNS: [RegExp, string[]][] = [
  [/financial aid|fafsa|scholarship|grant/i, [
    'Gather tax returns, W-2s, and bank statements.',
    'Log in to the portal, or create an account.',
    'Complete the personal information section.',
    'Complete the income section from your documents.',
    'Answer any school-specific questions.',
    'Review the form and submit it.',
  ]],
  [/tax|taxes|irs|1040|w-2|w2/i, [
    'Gather W-2s, 1099s, and deduction receipts.',
    'Choose a filing method: software, a CPA, or IRS Free File.',
    'Enter your personal information and filing status.',
    'Enter income from each form.',
    'Enter deductions and credits.',
    'Review the summary and e-file.',
  ]],
  [/clean|cleaning|room|apartment|house|tidy|organize|mess/i, [
    'Set a 15-minute timer.',
    'Throw away the obvious trash.',
    'Move all dishes to the sink.',
    'Put dirty clothes in the hamper and put clean clothes away.',
    'Wipe down the desk, nightstand, and counters.',
    'Vacuum or sweep the floor.',
  ]],
  [/email|emails|reply|respond|inbox|message/i, [
    'Open the email you need to answer.',
    'Identify what the sender is asking for.',
    'Draft a reply of 3-5 sentences that answers it.',
    'Check the draft for typos and tone.',
    'Send it.',
  ]],
  [/doctor|dentist|appointment|medical|health|therapist|checkup|eye|optometrist/i, [
    'Find the office number or booking page.',
    'Book the appointment by phone or online.',
    'Add it to your calendar with a reminder the day before.',
    'Complete any paperwork required in advance.',
  ]],
  [/study|studying|exam|test|homework|assignment|essay|paper|project|presentation/i, [
    'Pick one topic or section to work on.',
    'Set up your materials and close unrelated tabs.',
    'Work for 25 minutes with a timer running.',
    'Take a 5-minute break.',
    'Repeat for one or two more rounds.',
    'List what remains for the next session.',
  ]],
  [/resume|cv|job|apply|application|cover letter|interview|linkedin/i, [
    'Open your current resume or a template.',
    'Update your most recent experience.',
    'Match your bullet points to the language in the job listing.',
    'Write a summary of 2-3 sentences.',
    'Proofread it and save it as a PDF.',
    'Submit the application.',
  ]],
  [/laundry|clothes|wash|washing/i, [
    'Gather all the laundry.',
    'Sort it into lights and darks.',
    'Start the first load and set a timer.',
    'Move the load to the dryer or hang it up.',
    'Fold it and put it away.',
  ]],
  [/grocery|groceries|shopping|cook|cooking|meal prep|food/i, [
    'Check what you already have.',
    'List what you need.',
    'Choose a store or delivery app.',
    'Buy everything on the list.',
    'Put everything away.',
  ]],
  [/exercise|workout|gym|run|running|yoga|walk/i, [
    'Change into workout clothes.',
    'Choose a 15-20 minute workout or route.',
    'Fill a water bottle and put your shoes on.',
    'Start the workout.',
  ]],
  [/bill|bills|pay|payment|rent|utilities|subscription/i, [
    "List what's due from your email, bank app, and mail.",
    "Open each account or your bank's bill pay.",
    'Pay each bill, most urgent first.',
    'Confirm each payment went through.',
    'Set up auto-pay or calendar reminders.',
  ]],
];

const GENERIC = [
  'Open the website, document, or app you need.',
  'List the information or materials you need to gather.',
  'Work for 15 minutes with a timer running.',
  'Finish the first small piece.',
  'Take a 5-minute break, then do another round if needed.',
  'Save your progress.',
];

export function getSteps(task: string): Step[] {
  const match = BREAKDOWNS.find(([pattern]) => pattern.test(task));
  return (match ? match[1] : GENERIC).map(text => ({ text }));
}
