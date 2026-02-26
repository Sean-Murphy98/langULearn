const els = {
  yes: document.getElementById("answerYes"),
  no: document.getElementById("answerNo"),
  status: document.getElementById("status"),
  quizCard: document.getElementById("quizCard"),
  quizList: document.getElementById("quizList"),
  quizStatus: document.getElementById("quizStatus"),
  quizEmpty: document.getElementById("quizEmpty")
};

let currentQuizQuestions = [];

function setBusy(isBusy) {
  els.yes.disabled = isBusy;
  els.no.disabled = isBusy;
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function normalizeQuizPairs(pairs) {
  const seen = new Set();
  const normalized = [];

  (Array.isArray(pairs) ? pairs : []).forEach((pair) => {
    if (!pair || !pair.source || !pair.target) return;
    const source = String(pair.source).trim();
    const target = String(pair.target).trim();
    if (!source || !target) return;
    const key = `${source.toLowerCase()}::${target.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({ source, target });
  });

  return normalized;
}

function buildQuizQuestions(allPairs) {
  const pairs = normalizeQuizPairs(allPairs);
  if (pairs.length < 2) return [];

  const selected = [];
  const usedTargets = new Set();
  const shuffled = shuffle(pairs);

  for (let i = 0; i < shuffled.length && selected.length < 3; i += 1) {
    const pair = shuffled[i];
    const targetKey = pair.target.toLowerCase();
    if (usedTargets.has(targetKey)) continue;
    usedTargets.add(targetKey);
    selected.push(pair);
  }

  if (selected.length < 2) return [];

  const options = shuffle(selected.map((pair) => pair.target));
  return selected.map((pair, index) => ({
    id: `quizQuestion${index + 1}`,
    source: pair.source,
    target: pair.target,
    options
  }));
}

function getQuizScore() {
  if (!currentQuizQuestions.length) return null;

  let answered = 0;
  let correct = 0;
  currentQuizQuestions.forEach((question) => {
    const select = document.getElementById(question.id);
    if (!select) return;
    if (!select.value) return;
    answered += 1;
    if (select.value === question.target) correct += 1;
  });

  return {
    answered,
    correct,
    total: currentQuizQuestions.length
  };
}

function updateQuizStatus() {
  const score = getQuizScore();
  if (!score) {
    els.quizStatus.textContent = "";
    return;
  }

  if (!score.answered) {
    els.quizStatus.textContent = "Select a match for each word.";
    return;
  }

  els.quizStatus.textContent = `Quiz score: ${score.correct}/${score.total}${
    score.answered < score.total ? " (incomplete)" : ""
  }`;
}

function renderQuiz(questions) {
  currentQuizQuestions = questions;
  els.quizList.innerHTML = "";
  els.quizStatus.textContent = "";

  if (!questions.length) {
    els.quizCard.classList.add("d-none");
    els.quizEmpty.classList.remove("d-none");
    return;
  }

  els.quizCard.classList.remove("d-none");
  els.quizEmpty.classList.add("d-none");

  questions.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = "row g-2 align-items-center mb-2";

    const wordCol = document.createElement("div");
    wordCol.className = "col-5";
    const label = document.createElement("label");
    label.className = "form-label mb-0 fw-semibold";
    label.setAttribute("for", question.id);
    label.textContent = `${index + 1}. ${question.source}`;
    wordCol.appendChild(label);

    const selectCol = document.createElement("div");
    selectCol.className = "col-7";
    const select = document.createElement("select");
    select.id = question.id;
    select.className = "form-select form-select-sm";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose translation";
    select.appendChild(placeholder);

    question.options.forEach((optionText) => {
      const option = document.createElement("option");
      option.value = optionText;
      option.textContent = optionText;
      select.appendChild(option);
    });

    select.addEventListener("change", updateQuizStatus);
    selectCol.appendChild(select);

    row.appendChild(wordCol);
    row.appendChild(selectCol);
    els.quizList.appendChild(row);
  });

  updateQuizStatus();
}

async function loadQuizOnce() {
  try {
    const pairs = await pat.storage.getQuizWordPairs();
    const questions = buildQuizQuestions(pairs);
    renderQuiz(questions);
  } catch (_err) {
    els.quizCard.classList.add("d-none");
    els.quizEmpty.classList.remove("d-none");
    els.quizEmpty.textContent = "Could not load quiz words.";
  } finally {
    if (pat.storage && typeof pat.storage.clearQuizWordPairs === "function") {
      pat.storage.clearQuizWordPairs();
    } else {
      chrome.storage.local.set({ quizWordPairs: [] });
    }
  }
}

function sendResult(understood) {
  setBusy(true);
  els.status.textContent = "Saving response...";
  chrome.runtime.sendMessage({ type: "SURVEY_RESULT", understood }, (resp) => {
    if (resp && resp.ok) {
      const score = getQuizScore();
      const quizPart = score ? ` Quiz: ${score.correct}/${score.total}.` : "";
      els.status.textContent = `Saved.${quizPart} New percentage: ${resp.percent}%`;
      setTimeout(() => window.close(), 900);
    } else {
      els.status.textContent = "Could not save response.";
      setBusy(false);
    }
  });
}

els.yes.addEventListener("click", () => sendResult(true));
els.no.addEventListener("click", () => sendResult(false));

loadQuizOnce();
