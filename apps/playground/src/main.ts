import { VueESignature } from '@eimzo/vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(VueESignature)

app.mount('#app')
