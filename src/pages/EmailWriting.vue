<template>
  <div class="topic-page">
    <header class="topbar">
      <router-link to="/" class="wordmark">
        <span class="mark-dot"></span>
        Deutschprüfung
      </router-link>
      <div class="topbar-meta">GER · CEFR&nbsp;&nbsp;A1 – B1</div>
    </header>

    <section class="topic-hero">
      <p class="eyebrow">Dedicated topic</p>
      <h1 class="topic-title">E-Mail Schreiben</h1>
      <p class="dict-entry">
        <strong>Email Writing</strong>&nbsp;&nbsp;<em>writing practice</em> — real-world scenarios, graded by AI
      </p>
      <p class="topic-lede">
        Practice writing emails for realistic situations — booking a room, replying to a
        complaint, applying for a job, and more. Each response gets AI feedback based on
        tone, structure, and clarity.
      </p>
    </section>

    <section class="levels">
      <div class="section-head">
        <h2>Select your level</h2>
        <p>Scenarios get longer and more formal as levels increase.</p>
      </div>

      <div class="level-grid">
        <router-link :to="{ path: '/level/A1', query: { skill: 'email-writing' } }" class="level-card a1">
          <div class="shape-box"><span class="shape circle"></span></div>
          <p class="level-code">Niveau A1 — Anfänger</p>
          <h3>Short, simple messages</h3>
          <p class="level-desc">Informal notes to friends and family — 2-3 sentences.</p>
          <span class="level-cta">Prüfung starten <span class="arrow">→</span></span>
        </router-link>

        <router-link :to="{ path: '/level/A2', query: { skill: 'email-writing' } }" class="level-card a2">
          <div class="shape-box"><span class="shape square"></span></div>
          <p class="level-code">Niveau A2 — Grundstufe</p>
          <h3>Everyday requests</h3>
          <p class="level-desc">Bookings, complaints, and workplace messages — 3-4 sentences.</p>
          <span class="level-cta">Prüfung starten <span class="arrow">→</span></span>
        </router-link>

        <router-link :to="{ path: '/level/B1', query: { skill: 'email-writing' } }" class="level-card b1">
          <div class="shape-box"><span class="shape triangle"></span></div>
          <p class="level-code">Niveau B1 — Mittelstufe</p>
          <h3>Formal correspondence</h3>
          <p class="level-desc">Job applications, formal complaints, official requests — 4-5 sentences.</p>
          <span class="level-cta">Prüfung starten <span class="arrow">→</span></span>
        </router-link>
      </div>
    </section>

    <footer class="foot">
      <router-link to="/" class="back-link">← Back to home</router-link>
    </footer>
  </div>
</template>

<script setup></script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");

* {
  box-sizing: border-box;
}

.topic-page {
  --paper: #f2eee5;
  --ink: #16130e;
  --red: #e2261f;
  --blue: #1b4fd8;
  --yellow: #f5b80c;
  --muted: #6e675b;
  --rule: 2px solid var(--ink);

  font-family: "Archivo", sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
  padding: 0 clamp(20px, 5vw, 64px) 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 3px solid var(--ink);
}

.wordmark {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.02em;
  color: var(--ink);
  text-decoration: none;
}

.mark-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--yellow);
  border: 2px solid var(--ink);
}

.topbar-meta {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.topic-hero {
  padding: clamp(40px, 7vw, 80px) 0 clamp(28px, 4vw, 48px);
}

.eyebrow {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin: 0 0 18px;
}

.topic-title {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: clamp(2.6rem, 7vw, 5rem);
  line-height: 0.98;
  letter-spacing: -0.02em;
  margin: 0;
}

.dict-entry {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.92rem;
  color: var(--muted);
  border-left: 3px solid var(--ink);
  padding-left: 14px;
  margin: 24px 0 0;
}

.dict-entry strong {
  color: var(--ink);
  font-weight: 500;
}

.topic-lede {
  max-width: 560px;
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 22px 0 0;
  color: var(--ink);
}

.section-head {
  margin-bottom: 32px;
}

.section-head h2 {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: clamp(1.6rem, 3.4vw, 2.2rem);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.section-head p {
  color: var(--muted);
  margin: 0;
}

.levels {
  padding: clamp(16px, 4vw, 32px) 0 clamp(48px, 6vw, 72px);
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.level-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: var(--ink);
  background: var(--paper);
  border: var(--rule);
  padding: 28px 28px 32px;
  transition: background-color 0.25s ease, transform 0.25s ease;
}

.level-card:hover {
  transform: translateY(-6px);
}

.level-card:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 4px;
}

.shape-box {
  height: 80px;
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
}

.shape {
  display: block;
  width: 64px;
  height: 64px;
  transition: transform 0.3s ease, background-color 0.25s ease;
}

.circle {
  border-radius: 50%;
  background: var(--yellow);
}

.square {
  background: var(--red);
}

.triangle {
  background: var(--blue);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.level-card:hover .shape {
  transform: rotate(12deg) scale(1.06);
}

.level-code {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin: 0 0 10px;
}

.level-card h3 {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1.5rem;
  margin: 0 0 12px;
}

.level-desc {
  line-height: 1.65;
  margin: 0 0 24px;
  flex: 1;
}

.level-cta {
  font-family: "Jost", sans-serif;
  font-weight: 600;
  font-size: 1rem;
  border-bottom: 2px solid var(--ink);
  align-self: flex-start;
  padding-bottom: 2px;
  transition: border-color 0.25s ease;
}

.arrow {
  display: inline-block;
  transition: transform 0.25s ease;
}

.level-card:hover .arrow {
  transform: translateX(6px);
}

.a1:hover {
  background: var(--yellow);
}
.a1:hover .circle {
  background: var(--ink);
}

.a2:hover {
  background: var(--red);
  color: #fff;
}
.a2:hover .square {
  background: #fff;
}
.a2:hover .level-cta {
  border-color: #fff;
}

.b1:hover {
  background: var(--blue);
  color: #fff;
}
.b1:hover .triangle {
  background: #fff;
}
.b1:hover .level-cta {
  border-color: #fff;
}

.foot {
  border-top: 3px solid var(--ink);
  padding: 28px 0 48px;
}

.back-link {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  color: var(--ink);
  text-decoration: none;
  border-bottom: 2px solid var(--ink);
  padding-bottom: 2px;
}

.back-link:hover {
  color: var(--blue);
  border-color: var(--blue);
}

@media (max-width: 1000px) {
  .level-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .topbar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .topic-title {
    font-size: clamp(2.2rem, 12vw, 3.2rem);
  }
  .level-card {
    padding: 22px 22px 26px;
  }
}
</style>