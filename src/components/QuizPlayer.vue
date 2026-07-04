<template>
  <div class="quiz-player">

    <!-- NAME MODAL -->
    <div v-if="!playerName" class="name-modal-backdrop">
      <div class="name-modal">
        <p class="name-modal-kicker">Level {{ level }} Quiz</p>
        <h2 class="name-modal-title">Who's taking this exam?</h2>
        <div class="name-options">
          <button class="name-option" @click="selectName('Ivory')">
            <span class="name-option-letter">I</span>
            <span class="name-option-label">Ivory</span>
          </button>
          <button class="name-option" @click="selectName('Gin')">
            <span class="name-option-letter">G</span>
            <span class="name-option-label">Gin</span>
          </button>
        </div>
      </div>
    </div>

    <!-- QUIZ -->
    <template v-else>
      <section class="status-card">
        <div class="status-top">
          <div>
            <p class="status-kicker">Now practicing — {{ playerName }}</p>
            <h3>Level {{ level }} Quiz</h3>
          </div>
          <div class="status-stats">
            <span>{{ answeredCount }} answered</span>
            <span>{{ questions.length }} total</span>
          </div>
        </div>
        <div class="progress-track" role="progressbar" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="progressPercent">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <p class="progress-text">Question {{ displayQuestionNumber }} of {{ questions.length }}</p>
      </section>

      <section v-if="current" class="question-shell">
        <QuestionRenderer :question="current" @answered="onAnswered" />
      </section>

      <section v-if="feedback" class="feedback-card" :class="feedback.kind">
        {{ feedback.message }}
      </section>

      <section class="nav-row" v-if="!finished">
        <button @click="prev" class="nav-btn" :disabled="index === 0">Previous</button>
        <button @click="next" class="nav-btn nav-btn-primary" :disabled="index >= questions.length - 1">Next</button>
      </section>

      <section v-if="finished" class="result-card">
        <div class="result-title">Quiz Summary</div>
        <div class="result-line">Player: {{ playerName }}</div>
        <div class="result-line">Auto-scored points: {{ score }} / {{ maxScore }}</div>
        <div class="result-line">Completion: {{ answeredCount }} / {{ questions.length }} responses</div>
        <div class="result-line" v-if="scoreSubmitError">⚠ Score wasn't saved to the leaderboard — check your connection.</div>
        <router-link to="/leaderboard" class="leaderboard-link">View Leaderboard →</router-link>
        <button class="retry-btn" @click="restart">Try again</button>
      </section>

      <section v-if="finished" class="review-list">
        <div class="review-heading">Answer Review</div>
        <div
          v-for="(q, i) in questions"
          :key="q.id"
          class="review-item"
          :class="reviewStatusClass(q.id)"
        >
          <div class="review-item-top">
            <span class="review-number">Q{{ i + 1 }}</span>
            <span class="review-status">{{ reviewStatusLabel(q.id) }}</span>
          </div>
          <div class="review-prompt" v-html="q.prompt"></div>
          <div class="review-row">
            <span class="review-label">Your answer</span>
            <span class="review-value">{{ results[q.id] ? results[q.id].value : '—' }}</span>
          </div>
          <div class="review-row" v-if="['mcq', 'gapfill', 'audio'].includes(q.type)">
            <span class="review-label">Correct answer</span>
            <span class="review-value">{{ q.answer }}</span>
          </div>
          <div class="review-row" v-if="q.type === 'short_answer' && results[q.id]">
            <span class="review-label">AI feedback</span>
            <span class="review-value">{{ results[q.id].detail }}</span>
          </div>
        </div>
      </section>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import QuestionRenderer from './QuestionRenderer.vue';

const props = defineProps({
  level: { type: String, default: 'A1' },
  questions: { type: Array, default: () => [] }
});

const index = ref(0);
const answers = ref({});
const results = ref({});
const score = ref(0);
const feedback = ref(null);
const randomizedQuestions = ref([]);
const isGrading = ref(false);
let advanceTimer = null;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Name modal — fixed choices, no free text
const playerName = ref('');
const scoreSubmitted = ref(false);
const scoreSubmitError = ref(false);

function selectName(name) {
  playerName.value = name;
}

const questions = computed(() => randomizedQuestions.value);
const current = computed(() => questions.value[index.value] || null);
const maxScore = computed(() => questions.value.reduce((s, q) => s + (q.points || 1), 0));
const finished = computed(() => index.value >= questions.value.length);
const answeredCount = computed(() => Object.keys(answers.value).length);
const displayQuestionNumber = computed(() => {
  if (questions.value.length === 0) return 0;
  return Math.min(index.value + 1, questions.value.length);
});
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0;
  const ratio = Math.min(index.value, questions.value.length) / questions.value.length;
  return Math.round(ratio * 100);
});

watch(
  () => props.questions,
  (newQuestions) => {
    randomizedQuestions.value = shuffleQuestions(newQuestions || []);
    index.value = 0;
    answers.value = {};
    results.value = {};
    score.value = 0;
    feedback.value = null;
    scoreSubmitted.value = false;
    scoreSubmitError.value = false;
    clearAdvanceTimer();
  },
  { immediate: true }
);

// Submit score to backend exactly once, the moment the quiz finishes
watch(finished, async (isFinished) => {
  if (!isFinished || scoreSubmitted.value || !playerName.value) return;
  scoreSubmitted.value = true;

  try {
    const res = await fetch(`${API_BASE}/api/submit-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: playerName.value,
        level: props.level,
        score: score.value,
        maxScore: maxScore.value
      })
    });
    if (!res.ok) throw new Error('Bad response');
  } catch (err) {
    console.error('Failed to submit score:', err);
    scoreSubmitError.value = true;
  }
});

function restart() {
  randomizedQuestions.value = shuffleQuestions(props.questions || []);
  index.value = 0;
  answers.value = {};
  results.value = {};
  score.value = 0;
  feedback.value = null;
  scoreSubmitted.value = false;
  scoreSubmitError.value = false;
  clearAdvanceTimer();
  playerName.value = ''; // show name modal again on retry
}

function shuffleQuestions(items) {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function clearAdvanceTimer() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function scheduleAdvance(delayMs) {
  clearAdvanceTimer();
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    next();
  }, delayMs);
}

function reviewStatusClass(id) {
  const r = results.value[id];
  if (!r) return 'review-skipped';
  if (r.status === 'correct') return 'review-correct';
  if (r.status === 'wrong') return 'review-wrong';
  return 'review-ungraded';
}

function reviewStatusLabel(id) {
  const r = results.value[id];
  if (!r) return '⚪ Skipped';
  if (r.status === 'correct') return '✅ Correct';
  if (r.status === 'wrong') return '❌ Wrong';
  return '📝 Not graded';
}

async function onAnswered({ id, value }) {
  const q = questions.value.find(x => x.id === id);
  if (!q) return;

  answers.value[id] = value;

  if (['mcq', 'gapfill', 'audio'].includes(q.type)) {
    const normalized = String(value || '').trim().toLowerCase();
    const correct = String(q.answer || '').trim().toLowerCase();

    if (normalized === correct) {
      score.value += (q.points || 1);
      feedback.value = { kind: 'ok', message: '✅ Correct!' };
      results.value[id] = { value, status: 'correct', detail: q.answer };
    } else {
      feedback.value = { kind: 'warn', message: '❌ Wrong.' };
      results.value[id] = { value, status: 'wrong', detail: q.answer };
    }
    scheduleAdvance(1800);
  }
  else if (q.type === 'short_answer') {
    isGrading.value = true;
    feedback.value = { kind: 'info', message: 'Checking your response…' };

    try {
      const res = await fetch(`${API_BASE}/api/check-writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: value,
          prompt: q.prompt,
          rubric: q.rubric || 'Evaluate for basic coherence, relevance to the prompt, and grammatical correctness appropriate to the stated level.'
        })
      });
      const data = await res.json();

      if (data.passed === true) {
        score.value += (q.points || 1);
        feedback.value = { kind: 'ok', message: `✅ ${data.feedback}` };
        results.value[id] = { value, status: 'correct', detail: data.feedback };
      } else if (data.passed === false) {
        feedback.value = { kind: 'warn', message: `📝 ${data.feedback}` };
        results.value[id] = { value, status: 'wrong', detail: data.feedback };
      } else {
        feedback.value = { kind: 'info', message: data.feedback };
        results.value[id] = { value, status: 'ungraded', detail: data.feedback };
      }
    } catch (err) {
      console.error(err);
      feedback.value = { kind: 'info', message: 'Response saved. AI feedback unavailable.' };
      results.value[id] = { value, status: 'ungraded', detail: 'AI feedback unavailable.' };
    } finally {
      isGrading.value = false;
      scheduleAdvance(7000);
    }
  }
}

function next() {
  clearAdvanceTimer();
  if (index.value < questions.value.length - 1) index.value++;
  else index.value = questions.value.length;
}
function prev() {
  clearAdvanceTimer();
  if (index.value > 0) index.value--;
}

onBeforeUnmount(() => clearAdvanceTimer());
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");

.quiz-player {
  --paper: #f2eee5;
  --ink: #16130e;
  --red: #e2261f;
  --blue: #1b4fd8;
  --yellow: #f5b80c;
  --muted: #6e675b;
  --rule: 2px solid var(--ink);

  font-family: "Archivo", sans-serif;
  color: var(--ink);
  max-width: 46rem;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

/* NAME MODAL */
.name-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(22, 19, 14, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.name-modal {
  background: var(--paper);
  border: 3px solid var(--ink);
  padding: 40px 36px;
  max-width: 26rem;
  width: 100%;
  text-align: center;
}

.name-modal-kicker {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 10px;
}

.name-modal-title {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.6rem;
  margin: 0 0 28px;
  color: var(--ink);
}

.name-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.name-option {
  border: 2px solid var(--ink);
  background: var(--paper);
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.name-option:hover {
  background: var(--yellow);
  transform: translateY(-3px);
}

.name-option:nth-child(2):hover {
  background: var(--blue);
  color: var(--paper);
}

.name-option-letter {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.2rem;
  background: var(--paper);
}

.name-option:nth-child(1) .name-option-letter {
  background: var(--yellow);
}

.name-option:nth-child(2) .name-option-letter {
  background: var(--blue);
  color: var(--paper);
}

.name-option-label {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.05rem;
}

/* STATUS CARD */
.status-card {
  border: var(--rule);
  background: var(--paper);
  padding: 20px 24px;
}
.status-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.status-kicker {
  margin: 0;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.74rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.status-card h3 {
  margin: 6px 0 0;
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.4rem;
  color: var(--ink);
}
.status-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.status-stats span {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  border: 2px solid var(--ink);
  padding: 4px 10px;
  color: var(--ink);
}
.progress-track {
  margin-top: 18px;
  height: 10px;
  border: 2px solid var(--ink);
  background: var(--paper);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--blue);
  transition: width 220ms ease;
}
.progress-text {
  margin: 10px 0 0;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.82rem;
  color: var(--muted);
}

.question-shell {
  background: transparent;
}

.feedback-card {
  border: 2px solid var(--ink);
  padding: 12px 16px;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}
.feedback-card.ok {
  background: var(--yellow);
  color: var(--ink);
}
.feedback-card.warn {
  background: var(--paper);
  border-color: var(--red);
  color: var(--red);
}
.feedback-card.info {
  background: var(--paper);
  border-color: var(--blue);
  color: var(--blue);
}

.nav-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.nav-btn,
.retry-btn {
  border: 2px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.nav-btn:hover:not(:disabled),
.retry-btn:hover {
  background: var(--ink);
  color: var(--paper);
}
.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.nav-btn-primary {
  background: var(--ink);
  color: var(--paper);
}
.nav-btn-primary:hover:not(:disabled) {
  background: var(--blue);
  border-color: var(--blue);
}

.result-card {
  border: var(--rule);
  background: var(--paper);
  padding: 24px;
  display: grid;
  gap: 6px;
}
.result-title {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.3rem;
  color: var(--ink);
}
.result-line {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.88rem;
  color: var(--muted);
}
.leaderboard-link {
  margin-top: 10px;
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--blue);
  text-decoration: none;
  border-bottom: 2px solid var(--blue);
  width: fit-content;
  padding-bottom: 2px;
}
.retry-btn {
  margin-top: 12px;
  width: fit-content;
}

.nav-btn:focus-visible,
.retry-btn:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 3px;
}

.review-list {
  display: grid;
  gap: 14px;
}
.review-heading {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.15rem;
  border-bottom: 3px solid var(--ink);
  padding-bottom: 8px;
}
.review-item {
  border: 2px solid var(--ink);
  background: var(--paper);
  padding: 16px 18px;
  border-left-width: 6px;
}
.review-correct { border-left-color: var(--yellow); }
.review-wrong { border-left-color: var(--red); }
.review-ungraded { border-left-color: var(--blue); }
.review-skipped { border-left-color: var(--muted); opacity: 0.75; }
.review-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.review-number {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.review-status {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  font-weight: 500;
}
.review-prompt {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.02rem;
  margin-bottom: 10px;
  line-height: 1.4;
}
.review-row {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-top: 4px;
  flex-wrap: wrap;
}
.review-label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  flex-shrink: 0;
  min-width: 110px;
}
.review-value {
  color: var(--ink);
}

@media (max-width: 700px) {
  .status-top {
    align-items: flex-start;
    flex-direction: column;
  }
  .nav-row {
    flex-direction: column;
  }
  .review-label {
    min-width: auto;
    width: 100%;
  }
  .name-options {
    grid-template-columns: 1fr;
  }
}
</style>