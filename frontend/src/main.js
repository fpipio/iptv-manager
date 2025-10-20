import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/style.css'

// Import views
import ImportView from './views/ImportView.vue'
import ManageView from './views/ManageView.vue'
import ExportView from './views/ExportView.vue'
import SettingsView from './views/SettingsView.vue'
import EpgMatchingView from './views/EpgMatchingView.vue'
import MoviesView from './views/MoviesView.vue'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/import' },
    { path: '/import', component: ImportView },
    { path: '/manage', component: ManageView },
    { path: '/movies', component: MoviesView },
    { path: '/export', component: ExportView },
    { path: '/settings', component: SettingsView },
    { path: '/epg/matching', component: EpgMatchingView }
  ]
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
