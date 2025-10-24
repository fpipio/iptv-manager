<template>
  <transition name="dialog">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="cancel"></div>

      <!-- Dialog -->
      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transform transition-all">
        <!-- Icon -->
        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full" :class="iconBgClass">
          <svg class="w-6 h-6" :class="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
          {{ title }}
        </h3>

        <!-- Message -->
        <p class="text-sm text-gray-600 text-center mb-6">
          {{ message }}
        </p>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            @click="cancel"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="confirm"
            class="flex-1 px-4 py-2 rounded-lg text-white transition-colors"
            :class="confirmButtonClass"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  type: {
    type: String,
    default: 'warning',
    validator: (value) => ['warning', 'danger', 'info'].includes(value)
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const show = ref(true);

const iconBgClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-100';
    case 'info':
      return 'bg-blue-100';
    default:
      return 'bg-yellow-100';
  }
});

const iconColorClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'text-red-600';
    case 'info':
      return 'text-blue-600';
    default:
      return 'text-yellow-600';
  }
});

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700';
    case 'info':
      return 'bg-blue-600 hover:bg-blue-700';
    default:
      return 'bg-indigo-600 hover:bg-indigo-700';
  }
});

const confirm = () => {
  show.value = false;
  emit('confirm');
};

const cancel = () => {
  show.value = false;
  emit('cancel');
};
</script>

<style scoped>
.dialog-enter-active, .dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .relative,
.dialog-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from, .dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .relative {
  transform: scale(0.95);
  opacity: 0;
}

.dialog-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
