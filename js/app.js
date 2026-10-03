(() => {
  const {
    PASSWORD,
    HINTS,
    QUESTIONS,
    CONGRATS_TEXT,
    SCORE_MESSAGES,
    CORRECT_TOASTS,
    SLIDE_INTERVAL_MS,
    SLIDES_LEFT,
    SLIDES_RIGHT,
    VIDEO_BOTTOM,
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
    slidesLeft: document.getElementById("slides-left"),
    slidesRight: document.getElementById("slides-right"),
    photoBottom: document.getElementById("photo-bottom"),
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
  const slideTimers = [];

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

  function stopSlideshows() {
    while (slideTimers.length) {
      clearInterval(slideTimers.pop());
    }
  }

  function mountSlideshow(container, sources, placeholder) {
    container.innerHTML = "";
    const list = (sources || []).filter(Boolean);

    if (!list.length) {
      container.innerHTML = `<span class="photo-placeholder">${placeholder}</span>`;
      return;
    }

    const images = list.map((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      if (index === 0) img.classList.add("is-active");
      img.addEventListener("error", () => {
        img.remove();
        if (!container.querySelector("img") && !container.querySelector(".photo-placeholder")) {
          container.innerHTML = `<span class="photo-placeholder">${placeholder}</span>`;
        }
      });
      container.appendChild(img);
      return img;
    });

    if (images.length <= 1) return;

    let index = 0;
    const timer = setInterval(() => {
      const alive = [...container.querySelectorAll("img")];
      if (alive.length <= 1) {
        clearInterval(timer);
        return;
      }
      alive[index % alive.length].classList.remove("is-active");
      index = (index + 1) % alive.length;
      alive[index].classList.add("is-active");
    }, SLIDE_INTERVAL_MS || 3000);

    slideTimers.push(timer);
  }

  function videoMime(src) {
    const lower = String(src || "").toLowerCase();
    if (lower.endsWith(".mov")) return "video/quicktime";
    if (lower.endsWith(".webm")) return "video/webm";
    return "video/mp4";
  }

  function mountBottomVideo() {
    els.photoBottom.innerHTML = "";
    if (!VIDEO_BOTTOM) {
      els.photoBottom.innerHTML = `<span class="photo-placeholder">Место для видео</span>`;
      return;
    }

    const video = document.createElement("video");
    video.className = "bottom-video";
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.preload = "auto";

    const source = document.createElement("source");
    source.src = VIDEO_BOTTOM;
    source.type = videoMime(VIDEO_BOTTOM);
    video.appendChild(source);

    video.addEventListener("error", () => {
      els.photoBottom.innerHTML = `<span class="photo-placeholder">Не удалось загрузить видео (.mov лучше открывается в Safari; для Chrome/Firefox положи ещё .mp4)</span>`;
    });

    els.photoBottom.appendChild(video);

    const tryPlay = () => {
      video.play().catch(() => {
        /* браузер может блокировать автозапуск — останутся controls */
      });
    };
    video.addEventListener("loadeddata", tryPlay, { once: true });
    tryPlay();
  }

  function showCongrats() {
    const total = QUESTIONS.length;
    els.scoreValue.textContent = `Правильных ответов: ${score} из ${total}`;
    els.scorePhrase.textContent = scorePhrase(score);
    els.congratsText.textContent = CONGRATS_TEXT;

    stopSlideshows();
    mountSlideshow(els.slidesLeft, SLIDES_LEFT, "Фото слева");
    mountSlideshow(els.slidesRight, SLIDES_RIGHT, "Фото справа");
    mountBottomVideo();

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
    stopSlideshows();
    els.input.value = "";
    els.error.hidden = true;
    showScreen("password");
    els.input.focus();
  });

  renderHints();
  createSparkles();
  showScreen("password");
})();
