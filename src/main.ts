
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia();
const app = createApp(App);

app.config.unwrapInjectedRef = true;
app.use(pinia);

// Dynamic import drawable: It is important for dirty inheritance
import('@/core/drawable').then(() => {
	app.mount('#app');
});
