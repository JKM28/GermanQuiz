<template>
  <section class="question-card">
    <header class="question-header">
      <span class="question-type">{{ typeLabel }}</span>
      <span class="question-skill" v-if="question.skill">{{ question.skill }}</span>
    </header>

    <div v-if="isVerbPreposition" class="vp-card">
      <div class="vp-row">
        <span class="vp-label">Verb + Preposition</span>
        <strong class="vp-title">{{ question.verb }}</strong>
      </div>
      <div class="vp-meta">Case: {{ question.case }}</div>
      <div class="vp-example">Example: {{ question.example }}</div>
    </div>

    <div v-if="isEmailWriting" class="email-card">
      <div class="email-row">
        <span class="email-label">To</span>
        <strong class="email-title">{{ question.recipient }}</strong>
        <span class="email-tone" :class="question.tone">{{ question.tone }}</span>
      </div>
      <div class="email-scenario">{{ question.scenario }}</div>
    </div>

    <div class="question-prompt" v-html="question.prompt"></div>

    <p class="question-help" v-if="isVerbPreposition">Choose the English translation of the verb + preposition.</p>
    <p class="question-help" v-else-if="isEmailWriting">Write your email in the text box below.</p>
    <p class="question-help" v-else-if="question.type === 'mcq'">Choose one answer.</p>
    <p class="question-help" v-else-if="question.type === 'gapfill'">Type one short phrase to complete the blank.</p>
    <p class="question-help" v-else-if="question.type === 'short_answer'">Write 4-5 sentences. This answer is for practice and not auto-scored.</p>

    <div v-if="question.type === 'mcq'" class="option-list">
      <button
        v-for="(opt, i) in displayedOptions"
        :key="`${opt}-${i}`"
        class="option-btn"
        @click="select(opt)"
      >
        <span class="option-index">{{ letters[i] || i + 1 }}</span>
        <span>{{ opt }}</span>
      </button>
    </div>

    <div v-else-if="question.type === 'gapfill'" class="input-block">
      <input v-model="answer" class="answer-input" placeholder="Type your answer" />
      <button class="submit-btn" :disabled="!hasInput" @click="submit">Submit answer</button>
    </div>

    <div v-else-if="question.type === 'short_answer' || question.type === 'email_writing'" class="input-block">
      <textarea
        v-model="answer"
        rows="6"
        class="answer-input answer-textarea"
        :placeholder="isEmailWriting ? 'Write your email in German' : 'Write your response in German'"
      ></textarea>
      <button class="submit-btn" :disabled="!hasInput" @click="submit">
        {{ isEmailWriting ? 'Send Email' : 'Save response' }}
      </button>
    </div>

    <div v-else-if="question.type === 'audio'" class="input-block">
      <audio :src="question.audio_url" controls class="audio-player"></audio>
      <div class="option-list">
        <button
          v-for="(opt, i) in displayedOptions"
          :key="`${opt}-${i}`"
          class="option-btn"
          @click="select(opt)"
        >
          <span class="option-index">{{ letters[i] || i + 1 }}</span>
          <span>{{ opt }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
const props = defineProps({ question: Object });
const emit = defineEmits(['answered']);
const answer = ref('');
const displayedOptions = ref([]);
const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

const hasInput = computed(() => String(answer.value || '').trim().length > 0);
const isVerbPreposition = computed(() => props.question?.skill === 'verb-prepositions');
const isEmailWriting = computed(() => props.question?.type === 'email_writing');
const typeLabel = computed(() => {
  if (isVerbPreposition.value) return 'Verb + Preposition';
  if (isEmailWriting.value) return 'Email Writing';
  if (props.question?.type === 'mcq') return 'Multiple Choice';
  if (props.question?.type === 'gapfill') return 'Gap Fill';
  if (props.question?.type === 'short_answer') return 'Short Answer';
  if (props.question?.type === 'audio') return 'Audio';
  return 'Question';
});

watch(
  () => props.question?.id,
  () => {
    answer.value = '';
    displayedOptions.value = shuffleOptions(props.question?.options || []);
  },
  { immediate: true }
);

function shuffleOptions(items) {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function select(opt) {
  emit('answered', { id: props.question.id, value: opt });
}
function submit() {
  if (!hasInput.value) return;
  emit('answered', { id: props.question.id, value: answer.value });
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");

/* ==========================================
   TOKENS — same as home.vue / topic.vue
========================================== */

.question-card {
  --paper: #f2eee5;
  --ink: #16130e;
  --red: #e2261f;
  --blue: #1b4fd8;
  --yellow: #f5b80c;
  --muted: #6e675b;
  --rule: 2px solid var(--ink);

  font-family: "Archivo", sans-serif;
  color: var(--ink);
  background: var(--paper);
  border: var(--rule);
  padding: 28px;
}

/* ==========================================
   HEADER
========================================== */

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
  border-bottom: 3px solid var(--ink);
  padding-bottom: 16px;
}

.question-type,
.question-skill {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 2px solid var(--ink);
  background: transparent;
  padding: 4px 10px;
  color: var(--ink);
}

.question-skill {
  background: var(--yellow);
}

/* ==========================================
   VERB + PREPOSITION CARD
========================================== */

.vp-card {
  margin-top: 20px;
  border-left: 4px solid var(--blue);
  background: transparent;
  padding: 4px 0 4px 18px;
}

.vp-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.vp-label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.vp-title {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--ink);
}

.vp-meta,
.vp-example {
  margin-top: 6px;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
  color: var(--muted);
}

/* ==========================================
   EMAIL WRITING CARD
========================================== */

.email-card {
  margin-top: 20px;
  border-left: 4px solid var(--yellow);
  padding: 4px 0 4px 18px;
}

.email-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.email-label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.email-title {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--ink);
}

.email-tone {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  text-transform: uppercase;
  border: 2px solid var(--ink);
  padding: 2px 8px;
}

.email-tone.formal {
  background: var(--blue);
  color: var(--paper);
}

.email-tone.informal {
  background: var(--yellow);
  color: var(--ink);
}

.email-tone.semi-formal {
  background: var(--paper);
  color: var(--ink);
}

.email-scenario {
  margin-top: 8px;
  font-family: "Archivo", sans-serif;
  font-size: 0.95rem;
  color: var(--ink);
  line-height: 1.5;
}

/* ==========================================
   PROMPT
========================================== */

.question-prompt {
  margin-top: 26px;
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.3rem;
  line-height: 1.4;
  color: var(--ink);
}

.question-help {
  margin: 10px 0 0;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.82rem;
  color: var(--muted);
}

/* ==========================================
   OPTIONS
========================================== */

.option-list {
  margin-top: 22px;
  display: grid;
  gap: 12px;
}

.option-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 2px solid var(--ink);
  background: var(--paper);
  padding: 14px 16px;
  color: var(--ink);
  font-family: "Archivo", sans-serif;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.option-btn:hover {
  background: var(--ink);
  color: var(--paper);
  transform: translateX(4px);
}

.option-btn:hover .option-index {
  background: var(--yellow);
  color: var(--ink);
  border-color: var(--yellow);
}

.option-btn:focus-visible,
.submit-btn:focus-visible,
.answer-input:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 3px;
}

.option-index {
  min-width: 28px;
  height: 28px;
  border: 2px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  font-weight: 500;
  flex-shrink: 0;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

/* ==========================================
   TEXT / GAPFILL INPUTS
========================================== */

.input-block {
  margin-top: 22px;
}

.answer-input {
  width: 100%;
  border: 2px solid var(--ink);
  background: var(--paper);
  padding: 12px 14px;
  color: var(--ink);
  font-family: "Archivo", sans-serif;
  font-size: 1rem;
}

.answer-textarea {
  resize: vertical;
}

.submit-btn {
  margin-top: 14px;
  border: 2px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 22px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background: var(--blue);
  border-color: var(--blue);
}

.submit-btn:disabled {
  background: transparent;
  color: var(--muted);
  border-color: var(--muted);
  cursor: not-allowed;
}

/* ==========================================
   AUDIO
========================================== */

.audio-player {
  width: 100%;
  margin-bottom: 16px;
}

/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 700px) {
  .question-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .question-card {
    padding: 20px;
  }
  .question-prompt {
    font-size: 1.1rem;
  }
}
</style>