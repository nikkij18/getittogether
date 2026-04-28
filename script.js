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
  let currentMode = 'breakdown';
  let customStepsTextarea;
  let editableStepsTextarea;
  let editableStepsContainer;
  let updateStepsBtn;
  let customModeLabel;
  let breakdownModeLabel;

  // ---- Roast Templates ----
  // {task} gets replaced with the user's input
  const roasts = [
    `If you dont complete {task}, you must venmo Nikki $20...GO GO GO `,
  ];

  // ---- Motivational closers ----
  const closers = [
    "you've survived much worse. go do it.",
    "it's going to feel SO good when it's done. trust.",
    "future you is already saying thank you.",
    "one step at a time. you've SO got this.",
    "the hardest part is starting. everything after that is momentum.",
    "done is better than perfect. always.",
    "remember: 10 minutes of actually doing > 3 hours of dreading.",
  ];

  // ---- Task Breakdown Knowledge Base ----
  // Each category can match the task and contribute steps.
  const taskBreakdowns = [
    {
      name: 'Financial',
      pattern: /financial aid|fafsa|scholarship|grant/i,
      steps: [
        { text: "Gather your documents first — tax returns, W-2s, bank statements. Pile 'em up.", note: "check last year's return for reference" },
        { text: "Log into the portal/website and create an account (or recover your password for the 5th time)", note: "we've all been there" },
        { text: "Fill out the personal info section — name, address, the easy stuff. Quick wins.", note: null },
        { text: "Review and submit what you have, then do a little victory dance 💃", note: null },
      ],
    },
    {
      name: 'Taxes',
      pattern: /tax|taxes|irs|1040|w-2|w2/i,
      steps: [
        { text: "Gather all your forms — W-2s, 1099s, any deduction receipts. Make a lil pile.", note: "check email for digital copies too" },
        { text: "Pick your filing method: TurboTax, FreeTaxUSA, CPA, or good ol' IRS Free File", note: null },
        { text: "Enter your income from each form, one at a time", note: null },
        { text: "Review the summary, e-file, and BREATHE. You did it.", note: null },
      ],
    },
    {
      name: 'Cleaning',
      pattern: /clean|cleaning|room|apartment|house|tidy|organize|mess/i,
      steps: [
        { text: "Set a 15-minute timer. That's it. Just 15 minutes to start.", note: "put on a banger playlist 🎶" },
        { text: "Grab a trash bag and do a quick sweep — toss the obvious trash first", note: null },
        { text: "Collect all the dishes and bring them to the sink", note: null },
        { text: "Wipe down the main surfaces and call it done for now.", note: null },
      ],
    },
    {
      name: 'Email',
      pattern: /email|emails|reply|respond|inbox|message/i,
      steps: [
        { text: "Open your inbox. Don't scroll. Find THE email.", note: "you know the one 👀" },
        { text: "Read it one more time so you actually know what they're asking", note: null },
        { text: "Draft a response — it does NOT have to be perfect. Just answer the question.", note: "3-5 sentences is plenty" },
        { text: "Hit send and close the tab. You're done.", note: "it's sent. it's done. move on. 💨" },
      ],
    },
    {
      name: 'Medical',
      pattern: /doctor|dentist|appointment|medical|health|therapist|checkup|eye|optometrist/i,
      steps: [
        { text: "Find the number or website for the office. Google '[provider name] near me' if needed.", note: "or check your insurance portal" },
        { text: "Call or go online to book. Morning slots = less overthinking time.", note: null },
        { text: "Put it in your calendar RIGHT NOW with a reminder for the day before", note: null },
        { text: "If there's paperwork to fill out beforehand, do it today while you're in the zone", note: null },
      ],
    },
    {
      name: 'Studying',
      pattern: /study|studying|exam|test|homework|assignment|essay|paper|project|presentation/i,
      steps: [
        { text: "Pick ONE specific topic or section to focus on — not the whole thing", note: "small bites, not the whole cake 🍰" },
        { text: "Set up your study spot: water, charger, materials. Close social media tabs.", note: null },
        { text: "Set a 25-minute Pomodoro timer and just START reading/writing", note: "25 min is nothing, you watch longer TikToks" },
        { text: "Review what you did and make a quick list of what's left for next time", note: "progress tracking = serotonin 📈" },
      ],
    },
    {
      name: 'Job / Application',
      pattern: /resume|cv|job|apply|application|cover letter|interview|linkedin/i,
      steps: [
        { text: "Open your current resume (or a template if starting fresh)", note: "Google Docs has free templates!" },
        { text: "Update your most recent experience first — what did you actually DO?", note: "use action verbs: led, built, created, managed" },
        { text: "Check the job listing and mirror their language in your bullet points", note: "this is the cheat code 🎮" },
        { text: "Proofread, save as PDF, and submit the application", note: null },
      ],
    },
    {
      name: 'Laundry',
      pattern: /laundry|clothes|wash|washing/i,
      steps: [
        { text: "Gather ALL the laundry. Check the floor, the chair, the doorknob pile.", note: "yes, that pile counts too" },
        { text: "Sort into lights and darks (or just throw it all in on cold, we won't judge)", note: null },
        { text: "Put the first load in. Detergent. Start. Done.", note: "set a phone timer so you don't forget it 😅" },
        { text: "Fold and put it away right after it dries", note: "the dryer is NOT a dresser" },
      ],
    },
    {
      name: 'Grocery / Cooking',
      pattern: /grocery|groceries|shopping|cook|cooking|meal prep|food/i,
      steps: [
        { text: "Check what you already have — fridge, pantry, that one mystery shelf", note: null },
        { text: "Make a quick list of what you actually need. 10-15 items max.", note: "organized by aisle if you're feeling elite ✨" },
        { text: "Go buy the stuff or hit order on the app", note: null },
        { text: "Put everything away when you get home — yes, immediately.", note: "future you is literally cheering right now 📣" },
      ],
    },
    {
      name: 'Exercise',
      pattern: /exercise|workout|gym|run|running|yoga|walk/i,
      steps: [
        { text: "Put on your workout clothes. That's step one. Just the clothes.", note: "you're already 50% there honestly" },
        { text: "Pick a super short workout or route — 15-20 min max", note: "YouTube has great free ones!" },
        { text: "Press play on the video / walk out the door", note: "the hardest 30 seconds of the whole thing" },
        { text: "Move your body for however long feels good. Even 10 min counts.", note: "done is better than perfect 💪" },
      ],
    },
    {
      name: 'Bills / Payments',
      pattern: /bill|bills|pay|payment|rent|utilities|subscription/i,
      steps: [
        { text: "Make a list of what's due — check email, bank app, or that stack of mail 👀", note: null },
        { text: "Log into each account or open your bank's bill pay", note: null },
        { text: "Pay the most urgent items first", note: "auto-pay is your best friend for next time" },
        { text: "Set a reminder or auto-pay so you don't have to panic again 📅", note: null },
      ],
    },
  ];

  function mergeSteps(...stepLists) {
    const seen = new Set();
    return stepLists.flat().filter(step => {
      const key = step.text.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

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

  function parseCustomSteps() {
    if (!customStepsTextarea) return [];
    return customStepsTextarea.value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  function parseEditableSteps() {
    if (!editableStepsTextarea) return [];
    return editableStepsTextarea.value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  function setMode(mode) {
    currentMode = mode;
    if (!customStepsTextarea || !editableStepsContainer) return;

    const isCustom = mode === 'custom';
    customStepsTextarea.parentElement.style.display = isCustom ? 'block' : 'none';
    editableStepsContainer.style.display = isCustom ? 'none' : editableStepsTextarea.value ? 'block' : 'none';
    roastBtn.textContent = isCustom ? 'Use my steps' : 'Break it down';

    if (customModeLabel && breakdownModeLabel) {
      customModeLabel.classList.toggle('active', isCustom);
      breakdownModeLabel.classList.toggle('active', !isCustom);
    }
  }

  function getSteps(task) {
    const lower = task.toLowerCase();
    const matches = taskBreakdowns.filter(({ pattern }) => pattern.test(lower));

    if (matches.length === 1) {
      return matches[0].steps.slice(0, 4);
    }

    if (matches.length > 1) {
      const combined = mergeSteps(...matches.map(match => match.steps));
      return combined.length ? combined.slice(0, 4) : genericSteps;
    }

    return genericSteps.slice(0, 4);
  }

  function generateRoast(task) {
    const template = pick(roasts);
    return template.replace(/\{task\}/g, task);
  }

  let draggedStep = null;

  function setupStepDragAndDrop(li) {
    li.draggable = true;
    li.style.cursor = 'grab';

    li.addEventListener('dragstart', (e) => {
      draggedStep = li;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'step');
    });

    li.addEventListener('dragend', () => {
      draggedStep = null;
      li.classList.remove('dragging');
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    li.addEventListener('dragenter', () => {
      if (li !== draggedStep) {
        li.classList.add('drag-over');
      }
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      if (!draggedStep || draggedStep === li) return;

      const rect = li.getBoundingClientRect();
      const insertAfter = (e.clientY - rect.top) > rect.height / 2;
      const referenceNode = insertAfter ? li.nextSibling : li;
      stepsList.insertBefore(draggedStep, referenceNode);
    });
  }

  function moveStep(li, direction) {
    if (!li) return;
    const sibling = direction === 'up' ? li.previousElementSibling : li.nextElementSibling;
    if (!sibling) return;
    if (direction === 'up') {
      stepsList.insertBefore(li, sibling);
    } else {
      stepsList.insertBefore(sibling, li);
    }
  }

  function renderSteps(steps) {
    stepsList.innerHTML = '';
    steps.forEach(step => {
      const li = document.createElement('li');
      li.className = 'step-item';

      const textSpan = document.createElement('span');
      textSpan.className = 'step-text';
      textSpan.textContent = step.text;
      li.appendChild(textSpan);

      if (step.note) {
        const note = document.createElement('span');
        note.className = 'step-note';
        note.textContent = step.note;
        li.appendChild(note);
      }

      const controls = document.createElement('div');
      controls.className = 'step-controls';

      const upButton = document.createElement('button');
      upButton.type = 'button';
      upButton.className = 'step-control-button';
      upButton.textContent = '↑';
      upButton.title = 'Move step up';
      upButton.addEventListener('click', () => moveStep(li, 'up'));

      const downButton = document.createElement('button');
      downButton.type = 'button';
      downButton.className = 'step-control-button';
      downButton.textContent = '↓';
      downButton.title = 'Move step down';
      downButton.addEventListener('click', () => moveStep(li, 'down'));

      controls.appendChild(upButton);
      controls.appendChild(downButton);
      li.appendChild(controls);

      setupStepDragAndDrop(li);
      stepsList.appendChild(li);
    });
  }

  stepsList.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  stepsList.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedStep) return;
    const target = e.target.closest('li');
    if (!target || target === draggedStep) {
      stepsList.appendChild(draggedStep);
      return;
    }

    const rect = target.getBoundingClientRect();
    const insertAfter = (e.clientY - rect.top) > rect.height / 2;
    const referenceNode = insertAfter ? target.nextSibling : target;
    stepsList.insertBefore(draggedStep, referenceNode);
  });

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

    if (currentMode === 'custom') {
      const steps = parseCustomSteps();
      if (!steps.length) {
        customStepsTextarea.focus();
        customStepsTextarea.classList.add('shake');
        setTimeout(() => customStepsTextarea.classList.remove('shake'), 500);
        return;
      }

      roastText.textContent = generateRoast(currentTask);
      renderSteps(steps.map(text => ({ text, note: null })));
      motivationText.textContent = pick(closers);
      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Fake loading for dramatic effect
    roastBtn.classList.add('loading');
    roastBtn.disabled = true;

    setTimeout(() => {
      const roast = generateRoast(currentTask);
      const steps = getSteps(currentTask);

      roastText.textContent = roast;
      editableStepsTextarea.value = steps.map(step => step.text).join('\n');
      editableStepsContainer.style.display = 'block';
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
    if (editableStepsTextarea) editableStepsTextarea.value = '';
    if (editableStepsContainer) editableStepsContainer.style.display = 'none';
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

  function createModeSwitcher() {
    if (!inputSection) return;

    const modeWrapper = document.createElement('div');
    modeWrapper.className = 'mode-switcher';
    modeWrapper.innerHTML = `
      <div class="mode-label">Mode:</div>
      <button type="button" class="mode-button active" data-mode="breakdown">Break it down</button>
      <button type="button" class="mode-button" data-mode="custom">Custom</button>
    `;

    const buttons = modeWrapper.querySelectorAll('.mode-button');
    breakdownModeLabel = buttons[0];
    customModeLabel = buttons[1];

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        setMode(button.dataset.mode);
      });
    });

    customStepsTextarea = document.createElement('textarea');
    customStepsTextarea.className = 'custom-steps-input';
    customStepsTextarea.placeholder = 'Write your own task steps here, one per line.';
    customStepsTextarea.rows = 4;
    customStepsTextarea.wrap = 'soft';

    const customStepContainer = document.createElement('div');
    customStepContainer.className = 'custom-steps-container';
    customStepContainer.appendChild(customStepsTextarea);

    editableStepsTextarea = document.createElement('textarea');
    editableStepsTextarea.className = 'editable-steps-input';
    editableStepsTextarea.placeholder = 'Edit generated steps here before applying them.';
    editableStepsTextarea.rows = 4;
    editableStepsTextarea.wrap = 'soft';

    updateStepsBtn = document.createElement('button');
    updateStepsBtn.type = 'button';
    updateStepsBtn.className = 'update-steps-button';
    updateStepsBtn.textContent = 'Apply edited steps';
    updateStepsBtn.style.display = 'block';
    updateStepsBtn.style.marginTop = '8px';

    updateStepsBtn.addEventListener('click', () => {
      const steps = parseEditableSteps();
      if (!steps.length) {
        editableStepsTextarea.focus();
        editableStepsTextarea.classList.add('shake');
        setTimeout(() => editableStepsTextarea.classList.remove('shake'), 500);
        return;
      }
      renderSteps(steps.map(text => ({ text, note: null })));
    });

    editableStepsContainer = document.createElement('div');
    editableStepsContainer.className = 'editable-steps-container';
    editableStepsContainer.style.display = 'none';
    editableStepsContainer.appendChild(editableStepsTextarea);
    editableStepsContainer.appendChild(updateStepsBtn);

    modeWrapper.appendChild(customStepContainer);
    modeWrapper.appendChild(editableStepsContainer);
    inputSection.insertBefore(modeWrapper, inputSection.firstChild);
  }

  createModeSwitcher();

  // ---- Fun: cycle logo emoji on hover ----
  const emojis = ['🫠', '😤', '🔥', '💀', '✨', '💅', '🫡', '🤡', '😭', '🌸'];
  let emojiIndex = 0;
  logoEmoji.addEventListener('mouseenter', () => {
    emojiIndex = (emojiIndex + 1) % emojis.length;
    logoEmoji.textContent = emojis[emojiIndex];
  });
})();
