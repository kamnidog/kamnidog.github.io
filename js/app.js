(() => {
  const {
    PASSWORD,
    HINTS,
    QUESTIONS,
    CONGRATS_TEXT,
    GIF_SLOTS,
    SCORE_MESSAGES,
    CORRECT_TOASTS,
  } = window.TEACHER_DAY;
  const LETTERS = ["А", "Б", "В", "Г"];

  const screens = {
    password: document.getElementById("screen-password"),
    quiz: document.getElementById("screen-quiz"),
    congrats: document.getElementById("screen-congrats"),
  };

  const els = {
    form: document.getElementById("password-form"),
    input: document.getElementById("password-input"),
    error: document.getElementById("password-error"),
    hintList: document.getElementById("hint-list"),
    progressLabel: document.getElementById("progress-label"),
    progressPercent: document.getElementById("progress-percent"),
    progressFill: document.getElementById("progress-fill"),
    questionKicker: document.getElementById("question-kicker"),
    questionText: document.getElementById("question-text"),
    answers: document.getElementById("answers"),
    scoreValue: document.getElementById("score-value"),
    scorePhrase: document.getElementById("score-phrase"),
    congratsText: document.getElementById("congrats-text"),
    gifGrid: document.getElementById("gif-grid"),
    restartBtn: document.getElementById("restart-btn"),
    sparkles: document.getElementById("sparkles"),
    toast: document.getElementById("toast"),
    toastKicker: document.getElementById("toast-kicker"),
    toastText: document.getElementById("toast-text"),
  };

  let currentQuestion = 0;
  let score = 0;
  let locked = false;
  let toastTimer = null;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      const active = key === name;
      el.hidden = !active;
      el.classList.toggle("is-active", active);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function normalize(value) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function scorePhrase(correctCount) {
    if (correctCount <= 4) return SCORE_MESSAGES.low;
    if (correctCount <= 8) return SCORE_MESSAGES.mid;
    return SCORE_MESSAGES.high;
  }

  function renderHints() {
    els.hintList.innerHTML = HINTS.map(
      (hint, index) => `
        <li class="hint-item">
          <div class="hint-num">${index + 1}</div>
          <div>
            <h3>${hint.title}</h3>
            <p>${hint.text}</p>
          </div>
        </li>
      `
    ).join("");
  }

  function renderQuestion() {
    const total = QUESTIONS.length;
    const q = QUESTIONS[currentQuestion];
    const step = currentQuestion + 1;
    const percent = Math.round((step / total) * 100);

    els.progressLabel.textContent = `Вопрос ${step} из ${total}`;
    els.progressPercent.textContent = `${percent}%`;
    els.progressFill.style.width = `${percent}%`;
    els.questionKicker.textContent = `Вопрос ${step}`;
    els.questionText.textContent = q.question;

    els.answers.innerHTML = q.options
      .map(
        (option, index) => `
          <button type="button" class="answer-btn" data-index="${index}">
            <span class="answer-letter">${LETTERS[index]}</span>
            <span>${option}</span>
          </button>
        `
      )
      .join("");

    locked = false;
  }

  function hideToast() {
    els.toast.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!els.toast.classList.contains("is-visible")) {
        els.toast.hidden = true;
      }
    }, 280);
  }

  function showCorrectToast() {
    const phrases = CORRECT_TOASTS || ["Верно!"];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    els.toastKicker.textContent = "Верно!";
    els.toastText.textContent = phrase;
    els.toast.hidden = false;
    requestAnimationFrame(() => els.toast.classList.add("is-visible"));

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 1100);
  }

  function goNext() {
    if (currentQuestion < QUESTIONS.length - 1) {
      currentQuestion += 1;
      renderQuestion();
    } else {
      hideToast();
      showCongrats();
    }
  }

  function pickAnswer(button) {
    if (locked) return;
    locked = true;

    const chosen = Number(button.dataset.index);
    const q = QUESTIONS[currentQuestion];
    const isCorrect = chosen === q.correct;

    if (isCorrect) {
      score += 1;
      button.classList.add("is-picked", "is-correct");
      showCorrectToast();
      setTimeout(goNext, 900);
    } else {
      button.classList.add("is-picked", "is-wrong");
      setTimeout(goNext, 420);
    }
  }

  function showCongrats() {
    const total = QUESTIONS.length;
    els.scoreValue.textContent = `Правильных ответов: ${score} из ${total}`;
    els.scorePhrase.textContent = scorePhrase(score);
    els.congratsText.textContent = CONGRATS_TEXT;
    els.gifGrid.innerHTML = GIF_SLOTS.map(
      (slot) => `
        <div class="gif-slot" aria-label="${slot.label}">
          <strong>${slot.label}</strong>
          <span>${slot.hint}</span>
        </div>
      `
    ).join("");
    showScreen("congrats");
    burstSparkles();
  }

  function createSparkles() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 28; i += 1) {
      const s = document.createElement("span");
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 3.5}s`;
      const size = `${5 + Math.random() * 7}px`;
      s.style.width = size;
      s.style.height = size;
      frag.appendChild(s);
    }
    els.sparkles.appendChild(frag);
  }

  function burstSparkles() {
    for (let i = 0; i < 12; i += 1) {
      const s = document.createElement("span");
      s.style.left = `${20 + Math.random() * 60}%`;
      s.style.top = `${10 + Math.random() * 40}%`;
      s.style.animationDelay = "0s";
      const size = `${8 + Math.random() * 10}px`;
      s.style.width = size;
      s.style.height = size;
      els.sparkles.appendChild(s);
      setTimeout(() => s.remove(), 3500);
    }
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = normalize(els.input.value);

    if (value === normalize(PASSWORD)) {
      els.error.hidden = true;
      currentQuestion = 0;
      score = 0;
      showScreen("quiz");
      renderQuestion();
      return;
    }

    els.error.hidden = false;
    els.form.classList.remove("is-shake");
    void els.form.offsetWidth;
    els.form.classList.add("is-shake");
    els.input.focus();
  });

  els.answers.addEventListener("click", (event) => {
    const button = event.target.closest(".answer-btn");
    if (!button) return;
    pickAnswer(button);
  });

  els.restartBtn.addEventListener("click", () => {
    currentQuestion = 0;
    score = 0;
    els.input.value = "";
    els.error.hidden = true;
    showScreen("password");
    els.input.focus();
  });

  renderHints();
  createSparkles();
  showScreen("password");
})();
