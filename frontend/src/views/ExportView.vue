<template>
  <div class="px-4 py-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Export M3U Playlist</h2>

    <div class="bg-white shadow rounded-lg p-6 max-w-2xl">
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 class="font-medium text-blue-900 mb-2">Export Information</h3>
          <p class="text-sm text-blue-800">
            Click the button below to generate your M3U playlist file with all selected channels and groups.
            The file will be available for download and can be accessed via HTTP.
          </p>
        </div>

        <button
          @click="generateExport"
          :disabled="exporting"
          class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {{ exporting ? 'Generating...' : 'Generate M3U File' }}
        </button>

        <!-- Success message -->
        <div v-if="exportResult" class="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 class="font-medium text-green-900 mb-2">Export Successful!</h3>
          <p class="text-sm text-green-800 mb-3">
            {{ exportResult.message }}
          </p>
          <div class="text-sm text-green-800 mb-3">
            <p>Groups: {{ exportResult.stats.groups }}</p>
            <p>Channels: {{ exportResult.stats.channels }}</p>
          </div>
          <div class="space-y-2">
            <a
              :href="exportResult.filePath"
              download
              class="inline-block w-full text-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Download M3U File
            </a>
            <div class="bg-white rounded border border-green-300 p-3">
              <p class="text-xs text-gray-600 mb-1">Direct URL:</p>
              <code class="text-xs text-gray-900 break-all">{{ getFullUrl(exportResult.filePath) }}</code>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="exportError" class="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 class="font-medium text-red-900 mb-2">Export Failed</h3>
          <p class="text-sm text-red-800">{{ exportError }}</p>
        </div>

        <!-- Preview section -->
        <div class="mt-6">
          <button
            @click="loadPreview"
            :disabled="loadingPreview"
            class="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {{ loadingPreview ? 'Loading...' : 'Preview M3U Content' }}
          </button>

          <div v-if="previewContent" class="mt-4">
            <div class="bg-gray-50 rounded-md p-4 border border-gray-300">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-medium text-gray-900">Preview</h4>
                <button
                  @click="previewContent = null"
                  class="text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
              <pre class="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">{{ previewContent }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const exporting = ref(false)
const exportResult = ref(null)
const exportError = ref(null)
const loadingPreview = ref(false)
const previewContent = ref(null)

const generateExport = async () => {
  exporting.value = true
  exportResult.value = null
  exportError.value = null

  try {
    const response = await axios.post('/api/export')
    exportResult.value = response.data
  } catch (error) {
    exportError.value = error.response?.data?.error || 'Export failed'
  } finally {
    exporting.value = false
  }
}

const loadPreview = async () => {
  loadingPreview.value = true
  previewContent.value = null

  try {
    const response = await axios.get('/api/export/preview')
    previewContent.value = response.data.content
  } catch (error) {
    console.error('Preview failed:', error)
  } finally {
    loadingPreview.value = false
  }
}

const getFullUrl = (path) => {
  return window.location.origin + path
}
</script>
