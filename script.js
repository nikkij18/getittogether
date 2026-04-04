// ============================================================
// Do The Thing 🫠 — Roast Engine + Task Breakdown Generator
// ============================================================

(() => {
  'use strict';

  // ---- DOM refs ----
  const taskInput    = document.getElementById('task-input');
  const roastBtn     = document.getElementById('roast-btn');
  const inputSection = document.getElementById('input-section');
  const resultsSection = document.getElementById('results-section');
  const roastText    = document.getElementById('roast-text');
  const stepsList    = document.getElementById('steps-list');
  const copyBtn      = document.getElementById('copy-btn');
  const anotherBtn   = document.getElementById('another-btn');
  const newBtn       = document.getElementById('new-btn');
  const toast        = document.getElementById('toast');
  const motivationText = document.getElementById('motivation-text');
  const logoEmoji    = document.getElementById('logo-emoji');
  const chips        = document.querySelectorAll('.suggestion-chip');

  let currentTask = '';

  // ---- Roast Templates ----
  // {task} gets replaced with the user's input
  const roasts = [
    `You've been "about to start" {task} for how long now? At this point, your procrastination deserves its own LinkedIn profile. It has more experience than you. 😤`,
    `Bestie, the audacity of you sitting there scrolling while {task} is literally RIGHT THERE waiting for you. Your avoidance skills are genuinely impressive — too bad that's not a marketable skill. 💅`,
    `Fun fact: while you've been avoiding {task}, you've probably reorganized your entire desk, deep-cleaned your phone screen, and learned three TikTok dances. Incredible productivity — just not the useful kind. 🙃`,
    `You know what's scarier than {task}? The version of you three weeks from now who STILL hasn't done it and is now speed-running it at 2am with tears. Don't be that person. 😭`,
    `Listen, {task} is literally just sitting there, unbothered, while you have a whole existential crisis about starting it. It's not that deep. You are making it that deep. Stop it. 🫠`,
    `The fact that you need a website to roast you into doing {task} is the most beautifully unhinged form of self-awareness I've ever seen. Channel that energy into DOING THE THING. 🔥`,
    `Babe, {task} takes less time than the amount of time you've spent THINKING about doing it. Your brain invented a whole horror movie about a task that's basically a montage scene. Just press play. 🎬`,
    `You've spent more energy avoiding {task} than it would take to actually finish it. That's not laziness, that's TALENT. Now redirect that talent. 💫`,
    `Imagine explaining to your future successful self that you almost didn't make it because you kept putting off {task}. They'd be so embarrassed for you. Don't let them down. 🏆`,
    `{task}? More like "{task} that I will absolutely crush in the next 30 minutes because I'm actually capable and was just being a little dramatic." Fixed the name for you. ✨`,
    `The way you've been treating {task} like it's a final boss when it's literally a tutorial level enemy. You have the skills. You're just being a coward about it (affectionately). 🎮`,
    `Alexa, play "Just Do It" by {task} featuring Your Anxiety. Actually no — close Alexa, close Spotify, close everything, and OPEN THE THING. 📱`,
    `Let's be real: you came to this website because you KNOW you should be doing {task} right now. That's growth. That's self-awareness. Now take it one step further and actually start. 🌱`,
    `Here's the thing about {task}: future you is either going to be grateful or furious. Right now, you're choosing. And the couch is NOT the right answer. 🛋️`,
    `If you dont complete {task}, you must venmo Nikki $20...GO GO GO `,
  ];

  // ---- Motivational closers ----
  const closers = [
    "you've survived much worse. go do it.",
    "it's going to feel SO good when it's done. trust.",
    "future you is already saying thank you.",
    "you're more capable than your anxiety thinks. ",
    "one step at a time. you've SO got this.",
    "the hardest part is starting. everything after that is momentum.",
    "done is better than perfect. always.",
    "you're not lazy — you were just recharging. now GO.",
    "remember: 10 minutes of actually doing > 3 hours of dreading.",
  ];

  // ---- Task Breakdown Knowledge Base ----
  // Maps keywords to step arrays. Falls back to generic steps.
  const taskBreakdowns = {
    // Financial
    'financial aid|fafsa|scholarship|grant': [
      { text: "Gather your documents first — tax returns, W-2s, bank statements. Pile 'em up.", note: "check last year's return for reference" },
      { text: "Log into the portal/website and create an account (or recover your password for the 5th time)", note: "we've all been there" },
      { text: "Fill out the personal info section — name, address, the easy stuff. Quick wins.", note: null },
      { text: "Tackle the income section using the docs you gathered. Copy the numbers. Don't overthink.", note: null },
      { text: "Answer the school-specific questions if there are any", note: "usually just drop-downs, you've got this" },
      { text: "Review everything once, hit submit, and do a little victory dance 💃", note: null },
    ],
    'tax|taxes|irs|1040|w-2|w2': [
      { text: "Gather all your forms — W-2s, 1099s, any deduction receipts. Make a lil pile.", note: "check email for digital copies too" },
      { text: "Pick your filing method: TurboTax, FreeTaxUSA, CPA, or good ol' IRS Free File", note: null },
      { text: "Enter your personal info and filing status", note: "the warm-up round 🏃" },
      { text: "Input your income from each form, one at a time", note: null },
      { text: "Go through deductions and credits — student loans, donations, etc.", note: "free money you might be forgetting!" },
      { text: "Review the summary, e-file, and BREATHE. You did it.", note: null },
    ],
    // Cleaning
    'clean|cleaning|room|apartment|house|tidy|organize|mess': [
      { text: "Set a 15-minute timer. That's it. Just 15 minutes to start.", note: "put on a banger playlist 🎶" },
      { text: "Grab a trash bag and do a quick sweep — toss the obvious trash first", note: null },
      { text: "Collect all the dishes and bring them to the sink", note: null },
      { text: "Pick up clothes — dirty ones in the hamper, clean ones folded/hung", note: "the floor is NOT a shelf" },
      { text: "Wipe down surfaces — desk, nightstand, counters. Just a quick pass.", note: null },
      { text: "If you somehow still have energy, vacuum/sweep. Otherwise, celebrate. You did the thing. 🎉", note: null },
    ],
    // Email
    'email|emails|reply|respond|inbox|message': [
      { text: "Open your inbox. Don't scroll. Find THE email.", note: "you know the one 👀" },
      { text: "Read it one more time so you actually know what they're asking", note: null },
      { text: "Draft a response — it does NOT have to be perfect. Just answer the question.", note: "3-5 sentences is plenty" },
      { text: "Re-read your draft once for typos and tone", note: null },
      { text: "Hit send. Close the tab. Do NOT second-guess it.", note: "it's sent. it's done. move on. 💨" },
    ],
    // Medical
    'doctor|dentist|appointment|medical|health|therapist|checkup|eye|optometrist': [
      { text: "Find the number or website for the office. Google '[provider name] near me' if needed.", note: "or check your insurance portal" },
      { text: "Call or go online to book. Morning slots = less overthinking time.", note: null },
      { text: "Put it in your calendar RIGHT NOW with a reminder for the day before", note: null },
      { text: "If there's paperwork to fill out beforehand, do it today while you're in the zone", note: null },
      { text: "That's literally it. You just need to make one call/click. That's the whole task. 📞", note: null },
    ],
    // Studying
    'study|studying|exam|test|homework|assignment|essay|paper|project|presentation': [
      { text: "Pick ONE specific topic or section to focus on — not the whole thing", note: "small bites, not the whole cake 🍰" },
      { text: "Set up your study spot: water, charger, materials. Close social media tabs.", note: null },
      { text: "Set a 25-minute Pomodoro timer and just START reading/writing", note: "25 min is nothing, you watch longer TikToks" },
      { text: "After 25 min, take a 5-min break. Stretch, snack, exist.", note: null },
      { text: "Do one or two more rounds. You'll be surprised how much you get done.", note: null },
      { text: "Review what you did and make a quick list of what's left for next time", note: "progress tracking = serotonin 📈" },
    ],
    // Job/resume
    'resume|cv|job|apply|application|cover letter|interview|linkedin': [
      { text: "Open your current resume (or a template if starting fresh)", note: "Google Docs has free templates!" },
      { text: "Update your most recent experience first — what did you actually DO?", note: "use action verbs: led, built, created, managed" },
      { text: "Check the job listing and mirror their language in your bullet points", note: "this is the cheat code 🎮" },
      { text: "Write or update your summary/objective — 2-3 sentences max", note: null },
      { text: "Proofread, save as PDF, and attach it to the application", note: null },
      { text: "Hit submit and treat yourself. You're literally investing in your future. 🚀", note: null },
    ],
    // Laundry
    'laundry|clothes|wash|washing': [
      { text: "Gather ALL the laundry. Check the floor, the chair, the doorknob pile.", note: "yes, that pile counts too" },
      { text: "Sort into lights and darks (or just throw it all in on cold, we won't judge)", note: null },
      { text: "Put the first load in. Detergent. Start. Done.", note: "set a phone timer so you don't forget it 😅" },
      { text: "When it's done, move to dryer (or hang dry if you're fancy)", note: null },
      { text: "FOLD IT. Don't let it live in the dryer. Fold and put away. Right now.", note: "the dryer is NOT a dresser" },
    ],
    // Grocery/cooking
    'grocery|groceries|shopping|cook|cooking|meal prep|food': [
      { text: "Check what you already have — fridge, pantry, that one mystery shelf", note: null },
      { text: "Make a quick list of what you actually need. 10-15 items max.", note: "organized by aisle if you're feeling elite ✨" },
      { text: "Pick your store or delivery app. No browsing — stick to the list.", note: null },
      { text: "Go get the stuff (or hit 'order' on the app)", note: null },
      { text: "Put everything away when you get home. Yes, immediately.", note: "future you is literally cheering right now 📣" },
    ],
    // Exercise
    'exercise|workout|gym|run|running|yoga|walk': [
      { text: "Put on your workout clothes. That's step one. Just the clothes.", note: "you're already 50% there honestly" },
      { text: "Pick a super short workout or route — 15-20 min max", note: "YouTube has great free ones!" },
      { text: "Fill a water bottle and put your shoes on", note: null },
      { text: "Press play on the video / walk out the door / drive to the gym", note: "the hardest 30 seconds of the whole thing" },
      { text: "Move your body for however long feels good. Even 10 min counts.", note: "done is better than perfect 💪" },
    ],
    // Bills/payments
    'bill|bills|pay|payment|rent|utilities|subscription': [
      { text: "Make a list of what's due — check email, bank app, or that stack of mail 👀", note: null },
      { text: "Log into each account or open your bank's bill pay", note: null },
      { text: "Pay them one at a time. Start with the most urgent.", note: "auto-pay is your best friend for next time" },
      { text: "Confirm each payment went through", note: null },
      { text: "Set up auto-pay or calendar reminders so you never have to do this panic again 📅", note: null },
    ],
  };

  // ---- Generic fallback steps ----
  const genericSteps = [
    { text: "Open up whatever you need — the website, doc, app, or form. Just open it.", note: "opening ≠ doing, but it's the first domino 🎯" },
    { text: "Spend 2 minutes figuring out what info or materials you need to gather", note: null },
    { text: "Set a timer for 15 minutes and just START. No perfection, just action.", note: "you can do anything for 15 min" },
    { text: "Focus on the first small piece. Don't look at the whole mountain — just the next step.", note: null },
    { text: "After your timer goes off, take a 5-min break, then do another round if needed", note: null },
    { text: "Once you're done (or done enough for today), save your progress and reward yourself 🎉", note: "you literally earned it" },
  ];

  // ---- Helpers ----
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getSteps(task) {
    const lower = task.toLowerCase();
    for (const [pattern, steps] of Object.entries(taskBreakdowns)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(lower)) {
        return steps;
      }
    }
    return genericSteps;
  }

  function generateRoast(task) {
    const template = pick(roasts);
    return template.replace(/\{task\}/g, task);
  }

  function renderSteps(steps) {
    stepsList.innerHTML = '';
    steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step.text;
      if (step.note) {
        const note = document.createElement('span');
        note.className = 'step-note';
        note.textContent = step.note;
        li.appendChild(note);
      }
      stepsList.appendChild(li);
    });
  }

  function showToast() {
    toast.classList.remove('hidden');
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 350);
    }, 2500);
  }

  // ---- Core action ----
  function doTheRoast(task) {
    if (!task.trim()) {
      taskInput.focus();
      taskInput.parentElement.classList.add('shake');
      setTimeout(() => taskInput.parentElement.classList.remove('shake'), 500);
      return;
    }

    currentTask = task.trim();

    // Fake loading for dramatic effect
    roastBtn.classList.add('loading');
    roastBtn.disabled = true;

    setTimeout(() => {
      const roast = generateRoast(currentTask);
      const steps = getSteps(currentTask);

      roastText.textContent = roast;
      renderSteps(steps);
      motivationText.textContent = pick(closers);

      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      roastBtn.classList.remove('loading');
      roastBtn.disabled = false;
    }, 1200);
  }

  // ---- Event Listeners ----
  roastBtn.addEventListener('click', () => doTheRoast(taskInput.value));

  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doTheRoast(taskInput.value);
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const task = chip.dataset.task;
      taskInput.value = task;
      doTheRoast(task);
    });
  });

  anotherBtn.addEventListener('click', () => {
    doTheRoast(currentTask);
  });

  newBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    taskInput.value = '';
    taskInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  copyBtn.addEventListener('click', () => {
    const items = stepsList.querySelectorAll('li');
    let text = `Steps to: ${currentTask}\n\n`;
    items.forEach((li, i) => {
      text += `${i + 1}. ${li.childNodes[0].textContent.trim()}\n`;
    });
    navigator.clipboard.writeText(text).then(() => showToast());
  });

  // ---- Fun: cycle logo emoji on hover ----
  const emojis = ['🫠', '😤', '🔥', '💀', '✨', '💅', '🫡', '🤡', '😭', '🌸'];
  let emojiIndex = 0;
  logoEmoji.addEventListener('mouseenter', () => {
    emojiIndex = (emojiIndex + 1) % emojis.length;
    logoEmoji.textContent = emojis[emojiIndex];
  });
})();
