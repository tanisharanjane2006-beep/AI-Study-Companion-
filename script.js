/*
 * AI Study Companion - Vanilla JS
 * Step 2: Tabs + Mock Quiz
 * Next: Grok + Hindsight API wiring (fetch templates included)
 */
document.addEventListener("DOMContentLoaded", () => {
  setupTodayLabel();
  setupTabs();
  setupQuiz();

  // Optional: let the user manually generate the plan later too.
  const generatePlanBtn = document.getElementById("generatePlanBtn");
  if (generatePlanBtn) {
    generatePlanBtn.addEventListener("click", () => {
      // Beginner-friendly: if you haven't finished the quiz yet,
      // we just show a hint. Once you finish the quiz, the flow runs automatically.
      const status = document.getElementById("studyPlanStatus");
      if (status) {
        status.textContent = "Generating plan... (requires quiz mistakes from Hindsight).";
      }
      // If the user hasn't taken the quiz yet, we generate a plan from
      // whatever is already stored in Hindsight (past mistakes). We pass
      // an empty "this run" list here.
      void generateStudyPlanFromHindsightAndGrok({ mistakesFromThisRun: [] });
    });
  }
});

function setupTodayLabel() {
  const todayLabel = document.getElementById("todayLabel");
  if (!todayLabel) return;
  const d = new Date();
  todayLabel.textContent = d.toLocaleDateString(undefined, { weekday: "short" });
}

function setupTabs() {
  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  if (!tabButtons.length || !panels.length) return;

  function activatePanel(panelId) {
    // Hide all panels
    panels.forEach((p) => p.classList.remove("is-active"));
    // Show just one panel
    const panelToShow = document.getElementById(panelId);
    if (panelToShow) panelToShow.classList.add("is-active");

    // Update tab selected state for accessibility
    tabButtons.forEach((btn) => {
      const controls = btn.getAttribute("aria-controls");
      const isThis = controls === panelId;
      btn.classList.toggle("is-active", isThis);
      btn.setAttribute("aria-selected", isThis ? "true" : "false");
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panelId = btn.getAttribute("aria-controls");
      if (panelId) activatePanel(panelId);
    });
  });

  // Ensure the initial active state is consistent with the CSS.
  const currentlyActivePanel = document.querySelector(".tab-panel.is-active");
  if (currentlyActivePanel) {
    const panelId = currentlyActivePanel.getAttribute("id");
    if (panelId) activatePanel(panelId);
  }
}

function setupQuiz() {
  // Quiz DOM
  const nextBtn = document.getElementById("nextBtn");
  const skipBtn = document.getElementById("skipBtn");
  const restartQuizBtn = document.getElementById("restartQuizBtn");

  const choiceButtons = Array.from(document.querySelectorAll(".choice-button"));
  const quizEnd = document.getElementById("quizEnd");
  const questionArticle = document.querySelector(".question");
  const quizTop = document.querySelector(".quiz-top");
  const fineprint = document.querySelector(".fineprint");

  const quizProgress = document.querySelector(".progress__bar"); // <progress>
  const quizProgressMetaCount = document.getElementById("quizProgressMetaCount");
  const quizProgressMetaHint = document.getElementById("quizProgressMetaHint");
  const quizTopicValue = document.getElementById("quizTopicValue");
  const questionNumber = document.getElementById("questionNumber");
  const questionText = document.getElementById("questionText");
  const questionHint = document.getElementById("questionHint");
  const answerPreviewDesc = document.getElementById("answerPreviewDesc");

  if (
    !nextBtn ||
    !choiceButtons.length ||
    !quizEnd ||
    !questionArticle ||
    !quizTop ||
    !quizProgress ||
    !quizTopicValue ||
    !questionNumber ||
    !questionText ||
    !questionHint ||
    !answerPreviewDesc
  ) {
    // If the HTML changed and we can't find the quiz, don't crash.
    return;
  }

  // Map choice letters to the buttons.
  const choiceByLetter = {};
  for (const btn of choiceButtons) {
    const letter = btn.getAttribute("data-choice");
    if (letter) choiceByLetter[letter] = btn;
  }

  // --- Mock Quiz Data ---
  // You can edit these later; the UI will update based on this array.
  const quizQuestions = [
    {
      topic: "Derivatives",
      promptHtml: 'What is the derivative of <span class="math">f(x) = x<sup>3</sup></span> ?',
      hintText:
        "Tip: Use the power rule: derivative of x^n is n·x^(n-1).",
      choices: {
        a: '3x<sup>2</sup>',
        b: 'x<sup>2</sup>',
        c: '2x<sup>3</sup>',
        d: '3x',
      },
      correct: "a",
    },
    {
      topic: "Derivatives",
      promptHtml: 'What is the derivative of <span class="math">g(x) = 5x</span> ?',
      hintText: "Tip: derivative of ax is just a.",
      choices: {
        a: "5",
        b: "x",
        c: "10x",
        d: "0",
      },
      correct: "a",
    },
    {
      topic: "Derivatives",
      promptHtml: 'What is the derivative of <span class="math">h(x) = x<sup>2</sup></span> ?',
      hintText: "Tip: power rule again—n·x^(n-1).",
      choices: {
        a: "2x",
        b: "x",
        c: "x<sup>3</sup>",
        d: "2x<sup>2</sup>",
      },
      correct: "a",
    },
  ];

  // --- Quiz state ---
  let currentIndex = 0;
  let selectedChoice = null;
  const mistakesThisRun = [];

  // --- Helpers ---
  function setChoiceSelected(letter) {
    // Only 1 choice at a time.
    Object.keys(choiceByLetter).forEach((k) => {
      choiceByLetter[k].classList.remove("is-selected");
    });
    selectedChoice = letter;
    if (choiceByLetter[letter]) choiceByLetter[letter].classList.add("is-selected");

    if (nextBtn) nextBtn.disabled = false;

    const key = choiceByLetter[letter]?.querySelector(".choice-button__key")?.textContent?.trim() ?? letter;
    answerPreviewDesc.textContent = `Preview: you picked ${key}.`;
  }

  function renderQuestion(index) {
    const q = quizQuestions[index];
    selectedChoice = null;

    // Reset selection styles
    Object.keys(choiceByLetter).forEach((k) => choiceByLetter[k].classList.remove("is-selected"));

    // Disable Next until a choice is made
    nextBtn.disabled = true;

    // Update DOM with question content
    quizTopicValue.textContent = q.topic;
    questionNumber.textContent = `Question ${index + 1}`;
    questionText.innerHTML = q.promptHtml;
    questionHint.textContent = q.hintText;
    answerPreviewDesc.textContent = "Select an option to preview the flow.";

    // Update choice texts
    for (const letter of ["a", "b", "c", "d"]) {
      const btn = choiceByLetter[letter];
      if (!btn) continue;
      const textNode = btn.querySelector(".choice-button__text");
      if (!textNode) continue;
      textNode.innerHTML = q.choices[letter] ?? "";
    }

    // Update progress UI
    const total = quizQuestions.length;
    if (quizProgress) {
      quizProgress.max = total;
      quizProgress.value = index + 1;
    }
    if (quizProgressMetaCount) quizProgressMetaCount.textContent = `${index + 1} / ${total}`;
    if (quizProgressMetaHint) quizProgressMetaHint.textContent = index === total - 1 ? "Final check" : "Keep going";
  }

  function resetQuizToStart() {
    currentIndex = 0;
    selectedChoice = null;
    mistakesThisRun.length = 0;

    // Show quiz question UI again
    if (quizEnd) quizEnd.hidden = true;
    questionArticle.hidden = false;
    quizTop.hidden = false;
    if (fineprint) fineprint.hidden = false;

    renderQuestion(0);
  }

  function showQuizEnd({ correctCount, totalCount }) {
    // Hide question UI; show end summary.
    if (quizEnd) {
      quizEnd.hidden = false;
    }
    questionArticle.hidden = true;
    quizTop.hidden = true;
    if (fineprint) fineprint.hidden = true;

    const quizEndScore = document.getElementById("quizEndScore");
    const quizEndBreakdown = document.getElementById("quizEndBreakdown");
    const quizEndTitle = document.getElementById("quizEndTitle");
    const quizEndDesc = document.getElementById("quizEndDesc");

    const percent = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;
    if (quizEndTitle) quizEndTitle.textContent = "Your Mock Score";
    if (quizEndDesc) quizEndDesc.textContent = "Saving mistakes and generating your plan… (template flow)";
    if (quizEndScore) quizEndScore.textContent = `${percent}%`;
    if (quizEndBreakdown) quizEndBreakdown.textContent = `${correctCount} correct out of ${totalCount}`;
  }

  // --- Quiz flow events ---
  choiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => setChoiceSelected(btn.getAttribute("data-choice")));
  });

  nextBtn.addEventListener("click", () => {
    const q = quizQuestions[currentIndex];
    const chosen = selectedChoice;
    if (!chosen) return;

    const isCorrect = chosen === q.correct;
    if (!isCorrect) {
      mistakesThisRun.push({
        topic: q.topic,
        questionPrompt: q.promptHtml.replace(/<[^>]+>/g, " ").trim(), // simple "plain-ish" text
        selected: chosen,
        correct: q.correct,
      });
    }

    currentIndex += 1;
    if (currentIndex >= quizQuestions.length) {
      const correctCount = quizQuestions.length - mistakesThisRun.length;
      showQuizEnd({ correctCount, totalCount: quizQuestions.length });

      // Start the API flow:
      // 1) Save mistakes to Hindsight
      // 2) Fetch past mistakes from Hindsight
      // 3) Send mistakes to Grok for a personalized plan
      void generateStudyPlanFromHindsightAndGrok({
        mistakesFromThisRun: mistakesThisRun,
      });

      return;
    }

    renderQuestion(currentIndex);
  });

  skipBtn.addEventListener("click", () => {
    const q = quizQuestions[currentIndex];
    // Treat skip as a mistake (no chosen answer).
    mistakesThisRun.push({
      topic: q.topic,
      questionPrompt: q.promptHtml.replace(/<[^>]+>/g, " ").trim(),
      selected: null,
      correct: q.correct,
      skipped: true,
    });

    currentIndex += 1;
    if (currentIndex >= quizQuestions.length) {
      const correctCount = quizQuestions.length - mistakesThisRun.length;
      showQuizEnd({ correctCount, totalCount: quizQuestions.length });
      void generateStudyPlanFromHindsightAndGrok({
        mistakesFromThisRun: mistakesThisRun,
      });
      return;
    }

    renderQuestion(currentIndex);
  });

  if (restartQuizBtn) {
    restartQuizBtn.addEventListener("click", () => resetQuizToStart());
  }

  // Start at the first question.
  resetQuizToStart();
}

/**
 * Runs the full API flow:
 * - POST quiz mistakes to Hindsight
 * - GET past mistakes from Hindsight
 * - POST mistakes to Grok to generate a personalized study plan
 * - Display plan in the dashboard
 */
async function generateStudyPlanFromHindsightAndGrok({ mistakesFromThisRun }) {
  const statusEl = document.getElementById("studyPlanStatus");
  const planTextEl = document.getElementById("studyPlanText");
  if (!statusEl || !planTextEl) return;

  // Show loading in the UI.
  statusEl.textContent = "Saving your quiz mistakes to Hindsight…";
  planTextEl.textContent = "";

  // ============================================================
  // API KEYS + ENDPOINTS (EDIT THIS PART)
  // Paste your keys here in this file (do NOT commit them).
  // ============================================================
  // Hindsight (local memory system) typically does not require an API key.
  // Only Grok needs an API key.
  const GROK_API_KEY = "PASTE_GROK_KEY_HERE";

  const HINSIGHT_BASE_URL =
    "http://localhost:8888/v1/default/banks/study-bank";
  const HINSIGHT_RETAIN_PATH = "/memories/retain";
  const HINSIGHT_RECALL_PATH = "/memories/recall";

  const GROK_CHAT_COMPLETIONS_URL = "https://api.x.ai/v1/chat/completions";
  const GROK_MODEL = "grok-beta";

  // Basic local user id so mistakes can be stored/retrieved.
  // (Beginner-friendly: this stays in your browser using localStorage.)
  const userId = getOrCreateLocalUserId();

  const canCallHindsight = HINSIGHT_BASE_URL.includes("localhost");
  const canCallGrok = GROK_API_KEY && !GROK_API_KEY.includes("PASTE_");

  function buildMistakeText(m) {
    // Turn our internal mistake object into a short text snippet for Hindsight.
    // Hindsight stores this as-is under `content`.
    const topic = m.topic ? `Topic: ${m.topic}. ` : "";
    const prompt = m.questionPrompt ? `Question: ${m.questionPrompt}. ` : "";
    const selected = m.selected ? `Chosen: ${m.selected}. ` : m.skipped ? "Chosen: (skipped). " : "";
    const correct = m.correct ? `Correct: ${m.correct}.` : "";
    return `${topic}${prompt}${selected}${correct}`.replace(/\s+/g, " ").trim();
  }

  // 1) Send quiz mistakes to Hindsight
  if (canCallHindsight) {
    // Store each mistake separately as a memory item.
    const mistakes = mistakesFromThisRun || [];
    const mistakeTexts = mistakes.map(buildMistakeText);

    // Template: POST /memories/retain with body: {"content":"the mistake text"}
    await Promise.all(
      mistakeTexts.map((content) =>
        retainMistakeToHindsight({
          baseUrl: HINSIGHT_BASE_URL,
          retainPath: HINSIGHT_RETAIN_PATH,
          content,
        })
      )
    );
  } else {
    statusEl.textContent =
      "Hindsight not reachable (check local URL). Using mistakes from this quiz only.";
  }

  // 2) Fetch past mistakes from Hindsight
  statusEl.textContent = "Fetching your past mistakes from Hindsight…";
  let pastMistakes = [];

  if (canCallHindsight) {
    // Template: POST /memories/recall with body: {"query":"What are my weak subjects?"}
    // and read: response.results[0].text
    pastMistakes = await recallPastMistakesFromHindsight({
      baseUrl: HINSIGHT_BASE_URL,
      recallPath: HINSIGHT_RECALL_PATH,
      query: "What are my weak subjects?",
    });
  } else {
    pastMistakes = [];
  }

  // Merge so Grok sees the newest run too.
  const mistakesFromThisRunTexts = (mistakesFromThisRun || []).map(buildMistakeText);
  const combinedMistakesTexts = [...mistakesFromThisRunTexts, ...(pastMistakes || [])];

  // 3) Ask Grok for a personalized study plan
  statusEl.textContent = "Generating your Personalized Study Plan with Grok…";
  let planText = "";

  if (canCallGrok) {
    planText = await generatePersonalizedStudyPlanWithGrok({
      apiKey: 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,
      completionsUrl: GROK_CHAT_COMPLETIONS_URL,
      model: GROK_MODEL,
      mistakes: combinedMistakesTexts,
    });
  } else {
    planText =
      "Grok key/URL missing. Paste your Grok API key at the top of script.js inside generateStudyPlanFromHindsightAndGrok().";
  }

  // 4) Display on the UI
  statusEl.textContent = "Plan ready.";
  planTextEl.textContent = planText || "No plan returned (check your API settings).";
}

function getOrCreateLocalUserId() {
  const KEY = "ascLocalUserId";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  // crypto.randomUUID is supported in modern browsers; keep a fallback for older ones.
  const id =
    (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
    `user_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  localStorage.setItem(KEY, id);
  return id;
}

// ============================================================
// Hindsight API fetch templates (Local Memory System)
// ============================================================
async function retainMistakeToHindsight({ baseUrl, retainPath, content }) {
  // Exact template from docs:
  // POST {baseUrl}{retainPath} with JSON body: {"content":"the mistake text"}
  const url = `${baseUrl}${retainPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Hindsight retain failed (${response.status}). ${errText}`.trim());
  }

  return await response.json().catch(() => ({}));
}

async function recallPastMistakesFromHindsight({ baseUrl, recallPath, query }) {
  // Exact template from docs:
  // POST {baseUrl}{recallPath} with JSON body: {"query":"What are my weak subjects?"}
  // Result text: response.results[0].text
  const url = `${baseUrl}${recallPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Hindsight recall failed (${response.status}). ${errText}`.trim());
  }

  const data = await response.json().catch(() => ({}));
  const text = data?.results?.[0]?.text;
  if (typeof text === "string" && text.trim().length) return [text.trim()];
  return [];
}

// ============================================================
// Grok API fetch template (chat/completions pattern)
// ============================================================
async function generatePersonalizedStudyPlanWithGrok({
  apiKey,
  completionsUrl,
  model,
  mistakes,
}) {
  // We keep this prompt beginner-friendly and ask for structured output.
  const prompt = [
    "You are a study coach.",
    "Based on the user's past mistakes, create a Personalized Study Plan.",
    "Requirements:",
    "- Keep it concise but actionable.",
    "- Provide a 3-day plan (Day 1, Day 2, Day 3).",
    "- For each day: list 2-3 sessions with suggested practice types (e.g. review, flashcards, practice problems).",
    "- End with a short checklist of what to do tomorrow.",
    "",
    "Past mistakes (JSON array of strings):",
    JSON.stringify(mistakes, null, 2),
  ].join("\n");

  // Template: POST chat completions.
  const response = await fetch(completionsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You write clear study plans for beginners." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Grok request failed (${response.status}). ${errText}`.trim());
  }

  const data = await response.json().catch(() => ({}));

  // Try typical response shapes.
  // Exact response field from docs:
  // response.choices[0].message.content
  const text = data?.choices?.[0]?.message?.content || "";

  return text || "Plan returned but no text content was found in the response.";
}

