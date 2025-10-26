<template>
  <transition name="toast">
    <div
      v-if="show"
      :class="['w-full sm:min-w-80 max-w-sm sm:max-w-md p-4 rounded-lg shadow-lg mx-4 sm:mx-0', bgClass]"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg v-if="type === 'success'" class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="type === 'error'" class="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="type === 'warning'" class="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p :class="['text-sm font-medium break-words', textClass]">{{ message }}</p>
        </div>
        <div class="flex-shrink-0">
          <button
            @click="close"
            :class="['rounded-md inline-flex p-1', hoverClass, 'focus:outline-none focus:ring-2 focus:ring-offset-2']"
          >
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const show = ref(true)

const bgClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-50 border border-green-200'
    case 'error':
      return 'bg-red-50 border border-red-200'
    case 'warning':
      return 'bg-yellow-50 border border-yellow-200'
    default:
      return 'bg-blue-50 border border-blue-200'
  }
})

const textClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-green-800'
    case 'error':
      return 'text-red-800'
    case 'warning':
      return 'text-yellow-800'
    default:
      return 'text-blue-800'
  }
})

const hoverClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-green-500 hover:text-green-600'
    case 'error':
      return 'text-red-500 hover:text-red-600'
    case 'warning':
      return 'text-yellow-500 hover:text-yellow-600'
    default:
      return 'text-blue-500 hover:text-blue-600'
  }
})

const close = () => {
  show.value = false
  emit('close')
}

onMounted(() => {
  if (props.duration > 0) {
    setTimeout(close, props.duration)
  }
})
</script>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
