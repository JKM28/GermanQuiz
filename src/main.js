import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import './index.css';

import App from './App.vue';
import Home from './pages/home.vue';
import Exam from './pages/exam.vue';
import TopicVerbPrepositions from './pages/topic.vue';
import EmailWriting from './pages/EmailWriting.vue';
import Level from './pages/level.vue';

const routes = [
	{ path: '/', name: 'Home', component: Home },
	{ path: '/exam', name: 'Exam', component: Exam },
	{ path: '/topic/verb-prepositions', name: 'TopicVerbPrepositions', component: TopicVerbPrepositions },
	{ path: '/email-writing', name: 'EmailWriting', component: EmailWriting },
	{ path: '/level/:level', name: 'Level', component: Level, props: true }
];

const router = createRouter({
	history: createWebHistory(),
	routes
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');