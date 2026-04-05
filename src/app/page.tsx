'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextDisperse } from '@/components/ui/text-disperse';
import { Typewriter } from '@/components/ui/typewriter';
import MorphingArrowButton from '@/components/ui/morphing-arrow-button';
import { Checkbox } from '@/components/ui/checkbox';

// ---- Roast Templates ----

const roastsByCategory: Record<string, string[]> = {

  // --- FINANCIALS: taxes, bills, FAFSA, financial aid, budgeting ---
  'tax|taxes|irs|fafsa|financial aid|scholarship|grant|bill|bills|rent|payment|utilities|subscription|budget|budgeting': [
    `You are letting the government keep your money because you won't sit down for 45 minutes. That's a crime against yourself.`,
    `Bestie, ignoring financial stuff doesn't make it go away. It just makes it bigger, scarier, and more expensive. You are literally paying a procrastination tax on top of your actual taxes.`,
    `Your bank account is out here suffering while you "don't feel like dealing with it." Feel like it. For your wallet's sake.`,
    `Every day you put this off is a day you're choosing stress over relief. The form is not that long. The website is not that complicated. You are the only obstacle.`,
    `The audacity of letting money stress you out but also not doing the one thing that fixes it. Sit down. Open the tab. Do the thing.`,
    `Future you — the one who filed on time, got the refund, and slept peacefully — is begging you to start right now.`,
  ],

  // --- EXERCISE: gym, running, yoga, walking, working out ---
  'exercise|workout|gym|run|running|yoga|walk|walking|pilates|lift|lifting|spin|cycling': [
    `You paid for that gym membership. It is sitting there. Judging you. Every. Single. Month.`,
    'Get the FUCK UP!',
    `The version of you that works out regularly is not a different person — it's just you, but you actually went. That's literally all it takes.`,
    `You're going to feel SO good after. You know this. You've done it before. So why are you lying on the couch like you don't know this?`,
    `Your body is a temple and right now you're treating it like a storage unit. Go move it. It doesn't even have to be that long.`,
    `Imagine being this close to the endorphins and just... not taking them. Free mood boost. Right there. Just a workout away.`,
    `You said "I'll go tomorrow" yesterday. And the day before. Tomorrow is a myth. The gym is real. Go.`,
  ],

  // --- SCHOOL: studying, homework, essays, projects, exams ---
  'study|studying|exam|test|homework|assignment|essay|paper|project|presentation|thesis|dissertation|read|reading|class|course': [
    `That assignment is not going to write itself. Trust me. I would know. It's been waiting for you for days and it has not moved one inch.`,
    `You're going to have to do it anyway. The only question is whether you do it with time to breathe or at 3am in a full panic spiral. Choose wisely.`,
    `The grade you want and the effort you're currently putting in are not on speaking terms. Time to reintroduce them.`,
    `Bestie, "I work better under pressure" is something people say when they've never actually tried NOT being under pressure. Try it. Start now.`,
    `Your professor is not thinking about you. Your grade, however, very much is. Go earn it.`,
    `Every hour you avoid this, the task gets scarier in your head and no smaller in reality. Just open the doc. That's step one.`,
    `Future you — sitting in that exam, or turning in that paper — is entirely depending on present you. Don't let them down for a TikTok scroll session.`,
  ],

  // --- CLEANING: room, laundry, dishes, organizing ---
  'clean|cleaning|room|apartment|house|tidy|organize|mess|laundry|dishes|wash|washing|vacuum|declutter|trash|folding': [
    `Can't bring a bad bitch back to a hoarder's house, lock in`,
    `Ewwwwwwwwwwwwwwwww`,
  ],

  // --- MISC: catch-all for everything else ---
  'default': [
    `You've been "about to start" {task} for how long now? At this point, your procrastination deserves its own LinkedIn profile. It has more experience than you.`,
    `Charlie Donovan golfs 24/7 and still gets {task} done. What’s your excuse?`,
    `Get the FUCK UP!`,
    `Do {task} now or venmo Nikki $20...GO GO GO`,
  ],
};

function getRoast(task: string): string {
  const lower = task.toLowerCase();
  for (const [pattern, roastList] of Object.entries(roastsByCategory)) {
    if (pattern === 'default') continue;
    if (new RegExp(pattern, 'i').test(lower)) return pick(roastList);
  }
  return pick(roastsByCategory['default']).replace(/\{task\}/g, task);
}

const closers = [
  "you've literally survived worse. go do it.",
  "it's going to feel SO good when it's done. trust.",
  "future you is already saying thank you.",
  "one step at a time. you've SO got this.",
  "the hardest part is starting. everything after that is momentum.",
  "done is better than perfect. always.",
  "you're not lazy — you were just recharging. now GO.",
  "remember: 10 minutes of actually doing > 3 hours of dreading.",
];

// ---- Task Breakdown Knowledge Base ----
interface Step {
  text: string;
  note: string | null;
}

const taskBreakdowns: Record<string, Step[]> = {
  'financial aid|fafsa|scholarship|grant': [
    { text: "Gather your documents first — tax returns, W-2s, bank statements. Pile 'em up.", note: "check last year's return for reference" },
    { text: "Log into the portal/website and create an account (or recover your password for the 5th time)", note: "we've all been there" },
    { text: "Fill out the personal info section — name, address, the easy stuff. Quick wins.", note: null },
    { text: "Tackle the income section using the docs you gathered. Copy the numbers. Don't overthink.", note: null },
    { text: "Answer the school-specific questions if there are any", note: "usually just drop-downs, you've got this" },
    { text: "Review everything once, hit submit, and do a little victory dance", note: null },
  ],
  'tax|taxes|irs|1040|w-2|w2': [
    { text: "Gather all your forms — W-2s, 1099s, any deduction receipts. Make a lil pile.", note: "check email for digital copies too" },
    { text: "Pick your filing method: TurboTax, FreeTaxUSA, CPA, or IRS Free File", note: null },
    { text: "Enter your personal info and filing status", note: "the warm-up round" },
    { text: "Input your income from each form, one at a time", note: null },
    { text: "Go through deductions and credits — student loans, donations, etc.", note: "free money you might be forgetting" },
    { text: "Review the summary, e-file, and BREATHE. You did it.", note: null },
  ],
  'clean|cleaning|room|apartment|house|tidy|organize|mess': [
    { text: "Set a 15-minute timer. That's it. Just 15 minutes to start.", note: "put on a banger playlist" },
    { text: "Grab a trash bag and do a quick sweep — toss the obvious trash first", note: null },
    { text: "Collect all the dishes and bring them to the sink", note: null },
    { text: "Pick up clothes — dirty ones in the hamper, clean ones folded/hung", note: "the floor is NOT a shelf" },
    { text: "Wipe down surfaces — desk, nightstand, counters. Just a quick pass.", note: null },
    { text: "If you somehow still have energy, vacuum/sweep. Otherwise, celebrate. You did the thing.", note: null },
  ],
  'email|emails|reply|respond|inbox|message': [
    { text: "Open your inbox. Don't scroll. Find THE email.", note: "you know the one" },
    { text: "Read it one more time so you actually know what they're asking", note: null },
    { text: "Draft a response — it does NOT have to be perfect. Just answer the question.", note: "3-5 sentences is plenty" },
    { text: "Re-read your draft once for typos and tone", note: null },
    { text: "Hit send. Close the tab. Do NOT second-guess it.", note: "it's sent. it's done. move on." },
  ],
  'doctor|dentist|appointment|medical|health|therapist|checkup|eye|optometrist': [
    { text: "Find the number or website for the office. Google it if needed.", note: "or check your insurance portal" },
    { text: "Call or go online to book. Morning slots = less overthinking time.", note: null },
    { text: "Put it in your calendar RIGHT NOW with a reminder for the day before", note: null },
    { text: "If there's paperwork to fill out beforehand, do it today while you're in the zone", note: null },
    { text: "That's literally it. You just need to make one call/click. That's the whole task.", note: null },
  ],
  'study|studying|exam|test|homework|assignment|essay|paper|project|presentation': [
    { text: "Pick ONE specific topic or section to focus on — not the whole thing", note: "small bites, not the whole cake" },
    { text: "Set up your study spot: water, charger, materials. Close social media tabs.", note: null },
    { text: "Set a 25-minute Pomodoro timer and just START reading/writing", note: "25 min is nothing" },
    { text: "After 25 min, take a 5-min break. Stretch, snack, exist.", note: null },
    { text: "Do one or two more rounds. You'll be surprised how much you get done.", note: null },
    { text: "Review what you did and make a quick list of what's left for next time", note: "progress tracking = serotonin" },
  ],
  'resume|cv|job|apply|application|cover letter|interview|linkedin': [
    { text: "Open your current resume (or a template if starting fresh)", note: "Google Docs has free templates" },
    { text: "Update your most recent experience first — what did you actually DO?", note: "use action verbs: led, built, created, managed" },
    { text: "Check the job listing and mirror their language in your bullet points", note: "this is the cheat code" },
    { text: "Write or update your summary/objective — 2-3 sentences max", note: null },
    { text: "Proofread, save as PDF, and attach it to the application", note: null },
    { text: "Hit submit and treat yourself. You're literally investing in your future.", note: null },
  ],
  'laundry|clothes|wash|washing': [
    { text: "Gather ALL the laundry. Check the floor, the chair, the doorknob pile.", note: "yes, that pile counts too" },
    { text: "Sort into lights and darks (or just throw it all in on cold, we won't judge)", note: null },
    { text: "Put the first load in. Detergent. Start. Done.", note: "set a phone timer so you don't forget it" },
    { text: "When it's done, move to dryer (or hang dry if you're fancy)", note: null },
    { text: "FOLD IT. Don't let it live in the dryer. Fold and put away. Right now.", note: "the dryer is NOT a dresser" },
  ],
  'grocery|groceries|shopping|cook|cooking|meal prep|food': [
    { text: "Check what you already have — fridge, pantry, that one mystery shelf", note: null },
    { text: "Make a quick list of what you actually need. 10-15 items max.", note: "organized by aisle if you're feeling elite" },
    { text: "Pick your store or delivery app. No browsing — stick to the list.", note: null },
    { text: "Go get the stuff (or hit 'order' on the app)", note: null },
    { text: "Put everything away when you get home. Yes, immediately.", note: "future you is literally cheering right now" },
  ],
  'exercise|workout|gym|run|running|yoga|walk': [
    { text: "Put on your workout clothes. That's step one. Just the clothes.", note: "you're already 50% there honestly" },
    { text: "Pick a super short workout or route — 15-20 min max", note: "YouTube has great free ones" },
    { text: "Fill a water bottle and put your shoes on", note: null },
    { text: "Press play on the video / walk out the door / drive to the gym", note: "the hardest 30 seconds of the whole thing" },
    { text: "Move your body for however long feels good. Even 10 min counts.", note: "done is better than perfect" },
  ],
  'bill|bills|pay|payment|rent|utilities|subscription': [
    { text: "Make a list of what's due — check email, bank app, or that stack of mail", note: null },
    { text: "Log into each account or open your bank's bill pay", note: null },
    { text: "Pay them one at a time. Start with the most urgent.", note: "auto-pay is your best friend for next time" },
    { text: "Confirm each payment went through", note: null },
    { text: "Set up auto-pay or calendar reminders so you never have to do this panic again", note: null },
  ],
};

const genericSteps: Step[] = [
  { text: "Open up whatever you need — the website, doc, app, or form. Just open it.", note: "opening it is the first domino" },
  { text: "Spend 2 minutes figuring out what info or materials you need to gather", note: null },
  { text: "Set a timer for 15 minutes and just START. No perfection, just action.", note: "you can do anything for 15 min" },
  { text: "Focus on the first small piece. Don't look at the whole mountain — just the next step.", note: null },
  { text: "After your timer goes off, take a 5-min break, then do another round if needed", note: null },
  { text: "Once you're done (or done enough for today), save your progress and reward yourself", note: "you literally earned it" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSteps(task: string): Step[] {
  const lower = task.toLowerCase();
  for (const [pattern, steps] of Object.entries(taskBreakdowns)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lower)) return steps;
  }
  return genericSteps;
}

// ---- Confetti ----
function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#34d399', '#818cf8'];
  const pieces: Array<{
    x: number; y: number; w: number; h: number;
    color: string; vx: number; vy: number; rot: number; vr: number;
    opacity: number;
  }> = [];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 18,
      vy: Math.random() * -16 - 4,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 90;

  function animate() {
    if (frame > maxFrames) {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rot += p.vr;
      p.opacity = Math.max(0, 1 - frame / maxFrames);
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rot * Math.PI) / 180);
      ctx!.globalAlpha = p.opacity;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx!.restore();
    }
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
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

// ============================================================
// Main Page Component
// ============================================================
export default function HomePage() {
  const [task, setTask] = useState('');
  const [roast, setRoast] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [closer, setCloser] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const currentTask = useRef('');
  const { dark, toggle } = useDarkMode();

  const doRoast = useCallback((taskText: string) => {
    const trimmed = taskText.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    currentTask.current = trimmed;
    setLoading(true);
    setTimeout(() => {
      setRoast(getRoast(trimmed));
      setSteps(getSteps(trimmed));
      setCloser(pick(closers));
      setShowResults(true);
      setLoading(false);
      setCheckedSteps(new Array(getSteps(trimmed).length).fill(false));
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 1000);
  }, []);

  const handleCopy = useCallback(() => {
    const text = steps.map((s, i) => `${i + 1}. ${s.text}`).join('\n');
    navigator.clipboard.writeText(`Steps to: ${currentTask.current}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [steps]);

  const handleNew = useCallback(() => {
    setShowResults(false);
    setTask('');
    setCheckedSteps([]);
    setTimeout(() => {
      inputRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, []);

  // Fire confetti when every step is checked off
  useEffect(() => {
    if (checkedSteps.length > 0 && checkedSteps.every(Boolean)) {
      if (canvasRef.current) fireConfetti(canvasRef.current);
    }
  }, [checkedSteps]);

  return (
    <>
      {/* Confetti canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="fixed top-5 right-5 z-40 w-11 h-11 rounded-full border-2 border-border bg-card flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:border-primary hover:shadow-lg"
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

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
        {/* Green radial gradient blob — centered, large */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(134,239,172,0.6),rgba(110,231,183,0.35)_40%,transparent_72%)] blur-2xl dark:opacity-35" />
        </div>

        {/* Small site label — top left like inspo */}
        <div className="relative z-10 px-8 pt-7">
          <span className="text-xs font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">Roast My Task</span>
        </div>

        {/* Hero text — shared hover zone, starts scattered, gathers on hover */}
        <div
          className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-14 pb-16 pt-8"
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
        >
          <div className="w-full overflow-visible">
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
            transition={{ duration: 0.4 }}
          >
            tell me the task you keep avoiding.{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">i&apos;ll bully you into doing it.</span>
          </motion.p>

          {/* Tags row */}
          <div className="flex items-center gap-6 mt-10">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Procrastination.</span>
            <span className="text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Redemption.</span>
            <span className="text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Done.</span>
          </div>
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-background">
        <div className="w-full max-w-xl mx-auto">
          {/* Input area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="text-4xl md:text-5xl font-bold text-foreground text-center mb-4 whitespace-nowrap [font-family:var(--font-display)]">
              I&apos;m avoiding{' '}
              <Typewriter
                text={['gym time', 'my taxes', 'my essay', 'laundry']}
                speed={65}
                deleteSpeed={35}
                waitTime={1800}
                cursorChar="_"
                className="text-emerald-500"
                cursorClassName=""
              />
            </div>

            <div className="flex gap-3 p-2 bg-card border-2 border-border rounded-3xl shadow-lg transition-all focus-within:border-emerald-500 focus-within:shadow-emerald-500/20 focus-within:shadow-xl">
              <input
                ref={inputRef}
                type="text"
                value={task}
                onChange={e => setTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doRoast(task)}
                placeholder="What are you avoiding?"
                maxLength={120}
                className="flex-1 bg-transparent border-none outline-none text-foreground font-semibold px-4 py-3 placeholder:text-muted-foreground/50"
              />
              <MorphingArrowButton onClick={() => doRoast(task)} disabled={loading} />
            </div>

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
                {/* Roast card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-card border-2 border-orange-200 dark:border-orange-900/50 rounded-2xl p-6 shadow-lg"
                >
                  <p className="text-foreground font-bold text-base md:text-lg leading-relaxed">{roast}</p>
                </motion.div>

                {/* Steps card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="bg-card border-2 border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">ok but here&apos;s how to actually do it</span>
                  </div>
                  <ol className="space-y-4">
                    {steps.map((step, i) => {
                      const isChecked = !!checkedSteps[i];
                      return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.1, duration: 0.3 }}
                          className="flex gap-3 items-start"
                        >
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
                            {/* Scribble strikethrough */}
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
                                animate={{
                                  pathLength: isChecked ? 1 : 0,
                                  opacity: isChecked ? 1 : 0,
                                }}
                                transition={{
                                  pathLength: { duration: 0.8, ease: 'easeInOut' },
                                  opacity: { duration: 0.01, delay: isChecked ? 0 : 0.8 },
                                }}
                                className="stroke-zinc-400 dark:stroke-zinc-500"
                              />
                            </motion.svg>
                            <motion.span
                              animate={{ opacity: isChecked ? 0.4 : 1 }}
                              transition={{ duration: 0.3 }}
                              className="text-foreground font-semibold text-sm leading-relaxed block"
                            >
                              {step.text}
                            </motion.span>
                            {step.note && (
                              <span className="block text-xs text-muted-foreground italic mt-0.5">{step.note}</span>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="flex gap-3 flex-wrap"
                >
                  <button
                    onClick={handleCopy}
                    className="flex-1 min-w-fit px-4 py-3 bg-card border-2 border-border rounded-xl text-sm font-bold text-foreground transition-all hover:border-muted-foreground hover:bg-secondary hover:-translate-y-0.5"
                  >
                    {copied ? 'copied!' : 'copy steps'}
                  </button>
                  <button
                    onClick={() => doRoast(currentTask.current)}
                    className="flex-1 min-w-fit px-4 py-3 bg-card border-2 border-border rounded-xl text-sm font-bold text-foreground transition-all hover:border-muted-foreground hover:bg-secondary hover:-translate-y-0.5"
                  >
                    roast me again
                  </button>
                  <button
                    onClick={handleNew}
                    className="flex-1 min-w-fit px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-transparent rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    new task
                  </button>
                </motion.div>

                {/* Motivational closer */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="text-center text-emerald-600 dark:text-emerald-400 font-bold text-lg italic pt-2"
                >
                  {closer}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-sm font-semibold bg-background">
        made with love, by N2K
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
            Copied to clipboard! Now go do the thing.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
