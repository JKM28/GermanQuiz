<template>
  <div class="level-page">
    <section class="level-hero">
      <div class="hero-glow hero-glow-left"></div>
      <div class="hero-glow hero-glow-right"></div>

      <p class="hero-kicker">German Practice Studio</p>
      <div class="hero-row">
        <h2 class="hero-title">{{ pageTitle }}</h2>
        <span class="level-pill" :class="levelClass">{{ level }}</span>
      </div>
      <p class="hero-subtitle">{{ subtitle }}</p>
      <router-link :to="backLink" class="back-link">{{ backLinkLabel }}</router-link>
    </section>

    <section class="quiz-shell">
      <div v-if="loading" class="state-card">Loading questions...</div>
      <div v-else-if="questions.length === 0" class="state-card state-warning">
        No questions found for this level.
      </div>
      <div v-else class="quiz-content">
        <QuizPlayer :level="level" :questions="questions" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import QuizPlayer from '../components/QuizPlayer.vue';
const props = defineProps({ level: { type: String, default: 'A1' } });
const route = useRoute();

const loading = ref(true);
const questions = ref([]);
const activeSkill = computed(() => {
  if (typeof route.query.skill !== 'string') return '';
  return route.query.skill.trim().toLowerCase();
});
const isVerbPrepositions = computed(() => activeSkill.value === 'verb-prepositions');
const isEmailWriting = computed(() => activeSkill.value === 'email-writing');
const pageTitle = computed(() => {
  if (isVerbPrepositions.value) return `Verb + Prepositions • ${props.level}`;
  if (isEmailWriting.value) return `Email Writing • ${props.level}`;
  return `Level ${props.level}`;
});
const subtitle = computed(() => {
  if (isVerbPrepositions.value) {
    return 'Check the verb, case, and example sentence, then choose the English translation.';
  }
  if (isEmailWriting.value) {
    return 'Read the scenario, then write an email in German. Your response is graded by AI for tone, structure, and clarity.';
  }
  return 'Local quiz (no auth). Questions are loaded from public/data/Questions.json.';
});
const backLink = computed(() => {
  if (isVerbPrepositions.value) return '/topic/verb-prepositions';
  if (isEmailWriting.value) return '/email-writing';
  return '/';
});
const backLinkLabel = computed(() => {
  if (isVerbPrepositions.value) return 'Back to Verb + Prepositions';
  if (isEmailWriting.value) return 'Back to Email Writing';
  return 'Back to home';
});
const levelClass = computed(() => {
  if (props.level === 'A1') return 'pill-a1';
  if (props.level === 'A2') return 'pill-a2';
  return 'pill-b1';
});

async function loadQuestions() {
  try {
    // Match the actual file name in public/data and keep a fallback for older naming.
    let res = await fetch('/data/Questions.json'); // public/data/Questions.json
    if (!res.ok) {
      res = await fetch('/data/questions.json');
    }
    const all = await res.json();
    const levelQuestions = all.filter((q) => q.level === props.level);
    const topicQuestions = activeSkill.value
      ? levelQuestions.filter((q) => String(q.skill || '').trim().toLowerCase() === activeSkill.value)
      : levelQuestions;
    questions.value = topicQuestions.length > 0 ? topicQuestions : levelQuestions;
  } catch (e) {
    console.error(e);
    questions.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => [props.level, activeSkill.value], loadQuestions, { immediate: true });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Manrope:wght@500;700&display=swap');

.level-page {
  --text: #1c2733;
  --muted: #4f6377;
  --panel: #fffdfa;
  --border: #e6e0d2;
  --canvas: #f7f4ec;
  display: grid;
  gap: 1rem;
  font-family: Manrope, 'Segoe UI', Tahoma, sans-serif;
}

.level-hero {
  position: relative;
  overflow: hidden;
  border-radius: 1.2rem;
  border: 1px solid var(--border);
  background:
    radial-gradient(120% 140% at 8% 0%, #ffe8bb 0%, #fff6e6 44%, #fffdfa 100%),
    linear-gradient(120deg, #fff9ef 0%, #ffffff 100%);
  padding: 1.2rem;
  isolation: isolate;
}

.hero-kicker {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8e6842;
  font-weight: 700;
}

.hero-row {
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.hero-title {
  margin: 0;
  color: var(--text);
  font-family: 'Space Grotesk', Manrope, sans-serif;
  font-size: clamp(1.65rem, 2.6vw, 2.2rem);
  line-height: 1.05;
}

.level-pill {
  border-radius: 999px;
  border: 1px solid rgba(16, 24, 39, 0.12);
  padding: 0.24rem 0.62rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #16202d;
  background: #ecf4ff;
}

.pill-a1 {
  background: #dff2ff;
}

.pill-a2 {
  background: #efe6ff;
}

.pill-b1 {
  background: #dcf7e8;
}

.hero-subtitle {
  margin: 0.6rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.back-link {
  display: inline-block;
  margin-top: 0.8rem;
  text-decoration: none;
  color: #0f66bf;
  font-weight: 700;
}

.back-link:hover {
  text-decoration: underline;
}

.quiz-shell {
  border-radius: 1rem;
  border: 1px solid var(--border);
  background:
    linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
  box-shadow: 0 14px 28px rgba(20, 31, 42, 0.08);
  padding: 0.7rem;
}

.quiz-content {
  border-radius: 0.85rem;
  background: var(--canvas);
}

.state-card {
  border-radius: 0.85rem;
  padding: 1rem;
  border: 1px solid #e8dfcf;
  background: #fff9ef;
  color: #3d4d5d;
  font-weight: 600;
}

.state-warning {
  background: #fff4dc;
  border-color: #f1ddb1;
}

.hero-glow {
  position: absolute;
  width: 11rem;
  height: 11rem;
  border-radius: 999px;
  filter: blur(32px);
  opacity: 0.34;
  z-index: 0;
  pointer-events: none;
}

.hero-glow-left {
  top: -4rem;
  left: -3rem;
  background: #ffd27a;
}

.hero-glow-right {
  right: -2.5rem;
  bottom: -4.5rem;
  background: #9ad8ff;
}

@media (max-width: 700px) {
  .hero-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .level-pill {
    align-self: flex-start;
  }
}
</style>