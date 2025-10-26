<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg p-4 sm:p-6 max-w-full sm:max-w-lg w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Import Summary</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="analysis" class="space-y-4">
        <!-- Summary Stats -->
        <div class="bg-blue-50 rounded-md p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-sm font-medium text-gray-700">Total Channels:</span>
            <span class="text-sm font-bold text-blue-600">{{ analysis.channels.total }}</span>
          </div>
          <div v-if="totalDuplicates > 0" class="flex justify-between">
            <span class="text-sm font-medium text-gray-700">Duplicates Found:</span>
            <span class="text-sm font-bold text-orange-600">{{ totalDuplicates }}</span>
          </div>
          <div v-if="analysis.movies.total > 0" class="flex justify-between">
            <span class="text-sm font-medium text-gray-700">Movies:</span>
            <span class="text-sm font-bold text-purple-600">{{ analysis.movies.total }}</span>
          </div>
        </div>

        <!-- Duplicates within file warning (always auto-renamed) -->
        <div v-if="analysis.channels.duplicatesInFile > 0" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-yellow-800">Duplicates within file detected!</p>
              <p class="text-xs text-yellow-700 mt-1">
                {{ analysis.channels.duplicatesInFile }} channel(s) have duplicate tvg-id within the same file.
                These will be automatically renamed (e.g., tvg-id-2, tvg-id-3) to keep all channels.
              </p>
            </div>
          </div>
        </div>

        <!-- Duplicates with database warning -->
        <div v-if="analysis.channels.duplicatesWithDb > 0" class="bg-orange-50 border border-orange-200 rounded-md p-4">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-orange-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-orange-800">Duplicates with database detected!</p>
              <p class="text-xs text-orange-700 mt-1">
                {{ analysis.channels.duplicatesWithDb }} channel(s) already exist in database with same tvg-id.
                Choose how to handle these duplicates:
              </p>
            </div>
          </div>
        </div>

        <!-- Strategy Selection -->
        <div v-if="analysis.channels.duplicatesWithDb > 0" class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Duplicate Handling Strategy:</label>

          <label class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50" :class="strategy === 'replace' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'">
            <input
              type="radio"
              value="replace"
              v-model="strategy"
              class="h-4 w-4 text-blue-600 mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-900">Replace Existing</span>
              <p class="text-xs text-gray-600 mt-1">Update existing channels with new data from the file</p>
            </div>
          </label>

          <label class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50" :class="strategy === 'rename' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'">
            <input
              type="radio"
              value="rename"
              v-model="strategy"
              class="h-4 w-4 text-blue-600 mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-900">Keep All (Auto-rename)</span>
              <p class="text-xs text-gray-600 mt-1">Keep both channels. Duplicates will be renamed (e.g., tvg-id-2, tvg-id-3)</p>
            </div>
          </label>

          <label class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50" :class="strategy === 'skip' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'">
            <input
              type="radio"
              value="skip"
              v-model="strategy"
              class="h-4 w-4 text-blue-600 mt-0.5"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-900">Skip Duplicates</span>
              <p class="text-xs text-gray-600 mt-1">Keep existing channels, ignore duplicates from the file</p>
            </div>
          </label>
        </div>

        <!-- No Duplicates with DB (only show when there are in-file duplicates but no db conflicts) -->
        <div v-if="analysis.channels.duplicatesInFile > 0 && analysis.channels.duplicatesWithDb === 0" class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm font-medium text-blue-800">
              Internal duplicates will be auto-renamed. No conflicts with database. Ready to import!
            </p>
          </div>
        </div>

        <!-- No Duplicates at all -->
        <div v-if="totalDuplicates === 0" class="bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm font-medium text-green-800">No duplicates detected. Ready to import!</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-2 pt-4 border-t">
          <button
            @click="close"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="confirm"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  analysis: Object
})

const emit = defineEmits(['close', 'confirm'])

const strategy = ref('replace')

// Total duplicates count (in-file + with-db)
const totalDuplicates = computed(() => {
  if (!props.analysis || !props.analysis.channels) return 0
  return (props.analysis.channels.duplicatesInFile || 0) + (props.analysis.channels.duplicatesWithDb || 0)
})

// Reset strategy when modal is opened
watch(() => props.show, (newVal) => {
  if (newVal) {
    strategy.value = 'replace'
  }
})

function close() {
  emit('close')
}

function confirm() {
  emit('confirm', strategy.value)
}
</script>
