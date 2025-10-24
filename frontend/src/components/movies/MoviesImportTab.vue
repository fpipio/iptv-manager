<template>
  <div class="space-y-6">
    <!-- Import mode selection: Upload / URL -->
    <div class="flex space-x-4">
      <button
        @click="importMode = 'upload'"
        :class="importMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
        class="px-4 py-2 rounded-md font-medium"
      >
        Upload File
      </button>
      <button
        @click="importMode = 'url'"
        :class="importMode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
        class="px-4 py-2 rounded-md font-medium"
      >
        From URL
      </button>
    </div>

    <!-- Upload mode -->
    <div v-if="importMode === 'upload'" class="space-y-4">
      <div
        @drop.prevent="handleDrop"
        @dragover.prevent
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".m3u,.m3u8"
          @change="handleFileSelect"
          class="hidden"
        />
        <div v-if="!selectedFile">
          <p class="text-gray-600 mb-2">Drag and drop your M3U file here, or</p>
          <button
            @click="fileInput.click()"
            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Select File
          </button>
        </div>
        <div v-else>
          <p class="text-gray-900 font-medium">{{ selectedFile.name }}</p>
          <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
          <button
            @click="clearFileInput"
            class="mt-2 text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>

      <button
        @click="uploadFile"
        :disabled="!selectedFile || importing"
        class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {{ importing ? 'Importing...' : 'Import File' }}
      </button>
    </div>

    <!-- URL mode -->
    <div v-if="importMode === 'url'" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">M3U URL</label>
        <input
          v-model="m3uUrl"
          type="url"
          placeholder="https://example.com/playlist.m3u"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        @click="importFromUrl"
        :disabled="!m3uUrl || importing"
        class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {{ importing ? 'Importing...' : 'Import from URL' }}
      </button>
    </div>

    <!-- Progress bar -->
    <div v-if="importing && importJobId" class="mt-4">
      <div class="flex justify-between text-sm text-gray-600 mb-2">
        <span>Importing...</span>
        <span>{{ importProgress.processed }} / {{ importProgress.total }} ({{ progressPercentage }}%)</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          class="bg-blue-600 h-3 transition-all duration-300 ease-out"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
    </div>

    <!-- Status message -->
    <div v-if="statusMessage" :class="statusType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'" class="mt-4 p-4 rounded-md">
      <p class="font-medium">{{ statusMessage }}</p>
      <div v-if="importStats" class="text-sm mt-2 space-y-2">
        <p v-if="importStats.created !== undefined">
          Total: {{ importStats.total }} | Created: {{ importStats.created }} | Updated: {{ importStats.updated }} | Deleted: {{ importStats.deleted }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import axios from 'axios'

const importMode = ref('upload')
const selectedFile = ref(null)
const fileInput = ref(null)
const m3uUrl = ref('')
const importing = ref(false)
const statusMessage = ref('')
const statusType = ref('')
const importStats = ref(null)
const importJobId = ref(null)
const importProgress = ref({ processed: 0, total: 0 })
const pollInterval = ref(null)

const clearFileInput = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && (file.name.endsWith('.m3u') || file.name.endsWith('.m3u8'))) {
    selectedFile.value = file
  }
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const progressPercentage = computed(() => {
  if (!importProgress.value.total) return 0
  return Math.round((importProgress.value.processed / importProgress.value.total) * 100)
})

const pollJobStatus = async (jobId) => {
  try {
    const response = await axios.get(`/api/movies/jobs/${jobId}`)
    const job = response.data.job || response.data

    if (job) {
      importProgress.value = {
        processed: job.processed || 0,
        total: job.total || 0
      }

      if (job.status === 'completed') {
        stopPolling()
        importing.value = false
        statusType.value = 'success'
        statusMessage.value = `Import completed: ${job.created || 0} created, ${job.updated || 0} updated`
        importStats.value = {
          total: job.total,
          created: job.created,
          updated: job.updated,
          deleted: job.deleted,
          skipped: job.skipped
        }
      } else if (job.status === 'failed') {
        stopPolling()
        importing.value = false
        statusType.value = 'error'
        statusMessage.value = job.error || 'Import failed'
      }
    }
  } catch (error) {
    console.error('Failed to poll job status:', error)
  }
}

const startPolling = (jobId) => {
  importJobId.value = jobId
  pollInterval.value = setInterval(() => {
    pollJobStatus(jobId)
  }, 500)
}

const stopPolling = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
  importJobId.value = null
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  await performImport('file')
}

const performImport = async (type) => {
  importing.value = true
  statusMessage.value = ''
  importStats.value = null
  importProgress.value = { processed: 0, total: 0 }

  try {
    let response
    if (type === 'file') {
      const formData = new FormData()
      formData.append('file', selectedFile.value)

      response = await axios.post('/api/import/movies/upload', formData)
      clearFileInput()
    } else { // url
      response = await axios.post('/api/import/movies/url', {
        url: m3uUrl.value
      })
      m3uUrl.value = ''
    }

    // New API returns jobId - start polling
    if (response.data.jobId) {
      importProgress.value.total = response.data.total
      startPolling(response.data.jobId)
    } else {
      // Legacy response format
      statusType.value = 'success'
      statusMessage.value = response.data.message
      importStats.value = response.data.stats
      importing.value = false
    }
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Import failed'
    importing.value = false
  }
}

const importFromUrl = async () => {
  if (!m3uUrl.value) return
  await performImport('url')
}

// Cleanup on component unmount
onUnmounted(() => {
  stopPolling()
})
</script>
