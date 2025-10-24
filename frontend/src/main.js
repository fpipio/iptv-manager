import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/style.css'

// Import new views
import ChannelsView from './views/ChannelsView.vue'
import MoviesView from './views/MoviesView.vue'
import SettingsView from './views/SettingsView.vue'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Default redirect
    { path: '/', redirect: '/channels' },

    // Channels area
    { path: '/channels', component: ChannelsView },

    // Movies area
    { path: '/movies', component: MoviesView },

    // Settings area
    { path: '/settings', component: SettingsView },

    // Legacy redirects (backward compatibility)
    { path: '/import', redirect: '/channels' },
    { path: '/manage', redirect: '/channels' },
    { path: '/epg/matching', redirect: '/channels' },
    { path: '/export', redirect: '/settings' }
  ]
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
