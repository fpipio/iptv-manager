<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">IPTV Manager</h1>
            </div>
            <!-- Desktop Navigation -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/channels"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2"
                :class="isActive('/channels') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                📺 Channels
              </router-link>
              <router-link
                to="/movies"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2"
                :class="isActive('/movies') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                🎬 Movies
              </router-link>
              <router-link
                to="/settings"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2"
                :class="isActive('/settings') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
              >
                ⚙️ Settings
              </router-link>
            </div>
          </div>
          <!-- Mobile menu button -->
          <div class="flex items-center sm:hidden">
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              :aria-expanded="mobileMenuOpen"
              aria-label="Main menu"
            >
              <!-- Icon: Hamburger when closed, X when open -->
              <svg v-if="!mobileMenuOpen" class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state -->
      <div v-show="mobileMenuOpen" class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          <router-link
            to="/channels"
            @click="mobileMenuOpen = false"
            class="block pl-3 pr-4 py-3 border-l-4 text-base font-medium"
            :class="isActive('/channels')
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'"
          >
            <span class="flex items-center gap-3">
              <span class="text-xl">📺</span>
              <span>Channels</span>
            </span>
          </router-link>
          <router-link
            to="/movies"
            @click="mobileMenuOpen = false"
            class="block pl-3 pr-4 py-3 border-l-4 text-base font-medium"
            :class="isActive('/movies')
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'"
          >
            <span class="flex items-center gap-3">
              <span class="text-xl">🎬</span>
              <span>Movies</span>
            </span>
          </router-link>
          <router-link
            to="/settings"
            @click="mobileMenuOpen = false"
            class="block pl-3 pr-4 py-3 border-l-4 text-base font-medium"
            :class="isActive('/settings')
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'"
          >
            <span class="flex items-center gap-3">
              <span class="text-xl">⚙️</span>
              <span>Settings</span>
            </span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <!-- Toast Notifications -->
    <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :type="toast.type"
        :message="toast.message"
        :duration="toast.duration"
        @close="removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import ToastNotification from './components/shared/ToastNotification.vue'
import { useToast } from './composables/useToast'

const route = useRoute()
const { toasts, removeToast } = useToast()

// Mobile menu state
const mobileMenuOpen = ref(false)

const isActive = (path) => {
  return route.path === path
}
</script>
