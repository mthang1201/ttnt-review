(function () {
  "use strict";

  const QUESTIONS = window.TTNT_QUESTIONS || [];
  const STORAGE_KEY = "ttnt-review-state-v1";
  const letters = ["A", "B", "C", "D"];

  const els = {
    lectureFilter: document.getElementById("lectureFilter"),
    topicFilter: document.getElementById("topicFilter"),
    difficultyFilter: document.getElementById("difficultyFilter"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    wrongModeBtn: document.getElementById("wrongModeBtn"),
    bookmarkedModeBtn: document.getElementById("bookmarkedModeBtn"),
    resetFiltersBtn: document.getElementById("resetFiltersBtn"),
    resetProgressBtn: document.getElementById("resetProgressBtn"),
    bookmarkBtn: document.getElementById("bookmarkBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    nextUnansweredBtn: document.getElementById("nextUnansweredBtn"),
    statTotal: document.getElementById("statTotal"),
    statDone: document.getElementById("statDone"),
    statCorrect: document.getElementById("statCorrect"),
    statWrong: document.getElementById("statWrong"),
    progressFill: document.getElementById("progressFill"),
    modeLabel: document.getElementById("modeLabel"),
    questionCounter: document.getElementById("questionCounter"),
    lectureBadge: document.getElementById("lectureBadge"),
    topicBadge: document.getElementById("topicBadge"),
    difficultyBadge: document.getElementById("difficultyBadge"),
    slideRefs: document.getElementById("slideRefs"),
    questionText: document.getElementById("questionText"),
    optionsList: document.getElementById("optionsList"),
    feedback: document.getElementById("feedback"),
    feedbackTitle: document.getElementById("feedbackTitle"),
    feedbackText: document.getElementById("feedbackText"),
    questionDots: document.getElementById("questionDots")
  };

  const defaultState = {
    completed: {},
    correct: {},
    incorrect: {},
    bookmarked: {}
  };

  let state = loadState();
  let mode = "all";
  let currentIndex = 0;
  let currentOrder = QUESTIONS.map((question) => question.id);
  let selectedAnswer = null;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return parsed ? { ...defaultState, ...parsed } : { ...defaultState };
    } catch (_error) {
      return { ...defaultState };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function unique(values) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "vi"));
  }

  function populateFilters() {
    const lectures = unique(QUESTIONS.map((question) => question.lecture));
    els.lectureFilter.innerHTML = `<option value="all">Tất cả chương</option>${lectures.map((lecture) => `<option value="${escapeAttr(lecture)}">${lecture}</option>`).join("")}`;
    refreshTopicFilter();
  }

  function refreshTopicFilter() {
    const lecture = els.lectureFilter.value;
    const source = lecture === "all" ? QUESTIONS : QUESTIONS.filter((question) => question.lecture === lecture);
    const topics = unique(source.map((question) => question.topic));
    const current = els.topicFilter.value;
    els.topicFilter.innerHTML = `<option value="all">Tất cả chủ đề</option>${topics.map((topic) => `<option value="${escapeAttr(topic)}">${topic}</option>`).join("")}`;
    els.topicFilter.value = topics.includes(current) ? current : "all";
  }

  function escapeAttr(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  }

  function getFilteredQuestions() {
    const lecture = els.lectureFilter.value;
    const topic = els.topicFilter.value;
    const difficulty = els.difficultyFilter.value;
    return QUESTIONS.filter((question) => {
      const visibleByMode =
        mode === "wrong" ? state.incorrect[question.id] :
        mode === "bookmarked" ? state.bookmarked[question.id] :
        true;
      return visibleByMode &&
        (lecture === "all" || question.lecture === lecture) &&
        (topic === "all" || question.topic === topic) &&
        (difficulty === "all" || question.difficulty === difficulty);
    });
  }

  function rebuildOrder(keepCurrentId) {
    const filteredIds = getFilteredQuestions().map((question) => question.id);
    const keepSet = new Set(filteredIds);
    currentOrder = currentOrder.filter((id) => keepSet.has(id));
    filteredIds.forEach((id) => {
      if (!currentOrder.includes(id)) currentOrder.push(id);
    });
    if (keepCurrentId && currentOrder.includes(keepCurrentId)) {
      currentIndex = currentOrder.indexOf(keepCurrentId);
    } else {
      currentIndex = Math.min(currentIndex, Math.max(currentOrder.length - 1, 0));
    }
  }

  function currentQuestion() {
    const id = currentOrder[currentIndex];
    return QUESTIONS.find((question) => question.id === id);
  }

  function render() {
    const question = currentQuestion();
    renderStats();
    renderModeLabel();
    if (!question) {
      renderEmptyState();
      return;
    }

    selectedAnswer = null;
    els.questionCounter.textContent = `Câu ${currentIndex + 1} / ${currentOrder.length}`;
    els.lectureBadge.textContent = question.lecture;
    els.topicBadge.textContent = question.topic;
    els.difficultyBadge.textContent = question.difficulty;
    els.slideRefs.textContent = `Reference: ${question.slideRefs.join(", ")}`;
    els.questionText.textContent = question.question;
    els.feedback.className = "feedback hidden";
    els.feedbackTitle.textContent = "";
    els.feedbackText.textContent = "";
    els.bookmarkBtn.classList.toggle("active", Boolean(state.bookmarked[question.id]));
    els.bookmarkBtn.textContent = state.bookmarked[question.id] ? "★" : "☆";
    els.bookmarkBtn.disabled = false;
    els.prevBtn.disabled = currentIndex === 0;
    els.nextBtn.disabled = currentIndex >= currentOrder.length - 1;
    els.nextUnansweredBtn.disabled = currentOrder.every((id) => state.completed[id]);

    els.optionsList.innerHTML = question.options.map((option, index) => `
      <button class="option-button" type="button" data-index="${index}">
        <span class="option-key">${letters[index]}</span>
        <span>${option}</span>
      </button>
    `).join("");

    els.optionsList.querySelectorAll(".option-button").forEach((button) => {
      button.addEventListener("click", () => answerQuestion(Number(button.dataset.index)));
    });

    renderDots();
  }

  function renderEmptyState() {
    els.questionCounter.textContent = "Không có câu phù hợp";
    els.lectureBadge.textContent = "Bộ lọc";
    els.topicBadge.textContent = "Trống";
    els.difficultyBadge.textContent = "-";
    els.slideRefs.textContent = "";
    els.questionText.textContent = "Không có câu hỏi trong chế độ hiện tại. Hãy bỏ lọc lại hoặc thoát chế độ ôn câu sai/đánh dấu.";
    els.optionsList.innerHTML = `<div class="empty-state">Thử đổi bộ lọc ở cột trái.</div>`;
    els.feedback.className = "feedback hidden";
    els.questionDots.innerHTML = "";
    els.bookmarkBtn.disabled = true;
    els.prevBtn.disabled = true;
    els.nextBtn.disabled = true;
    els.nextUnansweredBtn.disabled = true;
  }

  function renderStats() {
    const done = Object.keys(state.completed).length;
    const correct = Object.keys(state.correct).length;
    const wrong = Object.keys(state.incorrect).length;
    els.statTotal.textContent = QUESTIONS.length;
    els.statDone.textContent = done;
    els.statCorrect.textContent = correct;
    els.statWrong.textContent = wrong;
    els.progressFill.style.width = `${QUESTIONS.length ? Math.round((done / QUESTIONS.length) * 100) : 0}%`;
  }

  function renderModeLabel() {
    const labels = {
      all: "Tất cả câu hỏi",
      wrong: "Ôn lại câu sai",
      bookmarked: "Câu đã đánh dấu"
    };
    els.modeLabel.textContent = labels[mode];
  }

  function renderDots() {
    els.questionDots.innerHTML = currentOrder.map((id, index) => {
      const classes = ["dot"];
      if (index === currentIndex) classes.push("current");
      if (state.correct[id]) classes.push("done");
      if (state.incorrect[id]) classes.push("missed");
      return `<button type="button" class="${classes.join(" ")}" data-index="${index}">${index + 1}</button>`;
    }).join("");

    els.questionDots.querySelectorAll(".dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        currentIndex = Number(dot.dataset.index);
        render();
      });
    });
  }

  function answerQuestion(index) {
    const question = currentQuestion();
    if (!question) return;
    selectedAnswer = index;
    state.completed[question.id] = true;
    if (index === question.answerIndex) {
      state.correct[question.id] = true;
      delete state.incorrect[question.id];
    } else {
      state.incorrect[question.id] = true;
      delete state.correct[question.id];
    }
    saveState();
    revealAnswer();
    renderStats();
    renderDots();
  }

  function revealAnswer() {
    const question = currentQuestion();
    const isCorrect = selectedAnswer === question.answerIndex;
    els.optionsList.querySelectorAll(".option-button").forEach((button) => {
      const index = Number(button.dataset.index);
      button.disabled = true;
      if (index === question.answerIndex) button.classList.add("correct");
      if (index === selectedAnswer && !isCorrect) button.classList.add("wrong");
    });
    els.feedback.className = `feedback${isCorrect ? "" : " wrong"}`;
    els.feedbackTitle.textContent = isCorrect ? "Chính xác" : `Chưa đúng. Đáp án đúng là ${letters[question.answerIndex]}.`;
    els.feedbackText.textContent = question.explanation;
  }

  function shuffleOrder() {
    for (let i = currentOrder.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentOrder[i], currentOrder[j]] = [currentOrder[j], currentOrder[i]];
    }
    currentIndex = 0;
    render();
  }

  function setMode(nextMode) {
    const current = currentQuestion();
    mode = mode === nextMode ? "all" : nextMode;
    els.wrongModeBtn.classList.toggle("secondary", mode !== "wrong");
    els.bookmarkedModeBtn.classList.toggle("secondary", mode !== "bookmarked");
    rebuildOrder(current && current.id);
    render();
  }

  function move(delta) {
    currentIndex = Math.max(0, Math.min(currentOrder.length - 1, currentIndex + delta));
    render();
  }

  function goNextUnanswered() {
    const nextIndex = currentOrder.findIndex((id, index) => index > currentIndex && !state.completed[id]);
    const wrapIndex = currentOrder.findIndex((id) => !state.completed[id]);
    currentIndex = nextIndex >= 0 ? nextIndex : Math.max(wrapIndex, 0);
    render();
  }

  function resetFilters() {
    const current = currentQuestion();
    mode = "all";
    els.lectureFilter.value = "all";
    refreshTopicFilter();
    els.topicFilter.value = "all";
    els.difficultyFilter.value = "all";
    els.wrongModeBtn.classList.add("secondary");
    els.bookmarkedModeBtn.classList.add("secondary");
    rebuildOrder(current && current.id);
    render();
  }

  function resetProgress() {
    if (!window.confirm("Xóa toàn bộ tiến độ làm bài, câu sai và câu đánh dấu?")) return;
    state = { completed: {}, correct: {}, incorrect: {}, bookmarked: {} };
    saveState();
    mode = "all";
    currentIndex = 0;
    els.wrongModeBtn.classList.add("secondary");
    els.bookmarkedModeBtn.classList.add("secondary");
    rebuildOrder();
    render();
  }

  function bindEvents() {
    els.lectureFilter.addEventListener("change", () => {
      const current = currentQuestion();
      refreshTopicFilter();
      rebuildOrder(current && current.id);
      render();
    });
    [els.topicFilter, els.difficultyFilter].forEach((select) => {
      select.addEventListener("change", () => {
        const current = currentQuestion();
        rebuildOrder(current && current.id);
        render();
      });
    });
    els.shuffleBtn.addEventListener("click", shuffleOrder);
    els.wrongModeBtn.addEventListener("click", () => setMode("wrong"));
    els.bookmarkedModeBtn.addEventListener("click", () => setMode("bookmarked"));
    els.resetFiltersBtn.addEventListener("click", resetFilters);
    els.resetProgressBtn.addEventListener("click", resetProgress);
    els.prevBtn.addEventListener("click", () => move(-1));
    els.nextBtn.addEventListener("click", () => move(1));
    els.nextUnansweredBtn.addEventListener("click", goNextUnanswered);
    els.bookmarkBtn.addEventListener("click", () => {
      const question = currentQuestion();
      if (!question) return;
      if (state.bookmarked[question.id]) delete state.bookmarked[question.id];
      else state.bookmarked[question.id] = true;
      saveState();
      render();
    });
  }

  populateFilters();
  bindEvents();
  els.wrongModeBtn.classList.add("secondary");
  els.bookmarkedModeBtn.classList.add("secondary");
  rebuildOrder();
  render();
}());
