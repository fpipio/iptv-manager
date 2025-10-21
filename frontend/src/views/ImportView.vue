<template>
  <div class="px-4 py-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Import M3U Playlist</h2>

    <div class="bg-white shadow rounded-lg p-6 max-w-2xl">
      <!-- Main Tab selection: Channels / Movies -->
      <div class="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          @click="contentType = 'channels'"
          :class="contentType === 'channels' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'"
          class="px-6 py-3 font-semibold transition"
        >
          📺 TV Channels
        </button>
        <button
          @click="contentType = 'movies'"
          :class="contentType === 'movies' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'"
          class="px-6 py-3 font-semibold transition"
        >
          🎬 Movies
        </button>
      </div>

      <!-- Import mode sub-tabs: Upload / URL -->
      <div class="flex space-x-4 mb-6">
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
          <!-- Channels stats -->
          <p v-if="importStats.total !== undefined">
            Total: {{ importStats.total }} | New: {{ importStats.new }} | Updated: {{ importStats.updated }}
            <span v-if="importStats.renamed > 0" class="text-orange-700 font-medium">
              | Renamed: {{ importStats.renamed }}
            </span>
          </p>

          <!-- Renamed channels details -->
          <div v-if="importStats.renamedList && importStats.renamedList.length > 0" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p class="font-medium text-yellow-900 mb-2">⚠️ Duplicate tvg-id Renamed:</p>
            <div class="space-y-1 text-xs text-yellow-800 max-h-40 overflow-y-auto">
              <div v-for="(renamed, index) in importStats.renamedList" :key="index" class="flex items-start gap-2">
                <span class="text-yellow-600">•</span>
                <span>
                  <strong>{{ renamed.name }}</strong>:
                  <code class="bg-yellow-100 px-1 rounded">{{ renamed.originalTvgId }}</code> →
                  <code class="bg-green-100 px-1 rounded">{{ renamed.newTvgId }}</code>
                  <span class="text-yellow-600 ml-1">({{ renamed.reason === 'duplicate_in_file' ? 'duplicate in file' : 'duplicate with database' }})</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Movies stats -->
          <p v-if="importStats.created !== undefined">
            Total: {{ importStats.total }} | Created: {{ importStats.created }} | Updated: {{ importStats.updated }} | Deleted: {{ importStats.deleted }}
          </p>
        </div>
      </div>

      <!-- Danger Zone: Reset Database -->
      <div class="mt-8 border-t pt-6">
        <h3 class="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p class="text-sm text-gray-600 mb-4">
          These actions will permanently delete data from the database. These actions cannot be undone!
        </p>
        <div class="space-y-3">
          <!-- TV Channels Tab: Show channels/groups/EPG reset buttons -->
          <template v-if="contentType === 'channels'">
            <div class="flex items-center gap-3">
              <button
                @click="resetChannels"
                :disabled="resetting"
                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {{ resetting ? 'Resetting...' : 'Reset Channels Only' }}
              </button>
              <span class="text-sm text-gray-500">Delete all channels and EPG mappings (keep groups)</span>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="resetGroups"
                :disabled="resetting"
                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {{ resetting ? 'Resetting...' : 'Reset Groups Only' }}
              </button>
              <span class="text-sm text-gray-500">Delete all groups (except Unassigned), move channels to Unassigned</span>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="resetEpgMappings"
                :disabled="resetting"
                class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {{ resetting ? 'Resetting...' : 'Reset EPG Mappings Only' }}
              </button>
              <span class="text-sm text-gray-500">Delete all EPG mappings (keep channels and groups)</span>
            </div>
          </template>

          <!-- TV Channels Tab: Reset Everything (only TV data) -->
          <template v-if="contentType === 'channels'">
            <div class="border-t pt-3 mt-3"></div>
            <div class="flex items-center gap-3">
              <button
                @click="resetAllTvData"
                :disabled="resetting"
                class="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold"
              >
                {{ resetting ? 'Resetting...' : 'Reset All TV Data' }}
              </button>
              <span class="text-sm text-red-600 font-semibold">⚠️ Delete ALL TV data: channels, groups, and EPG mappings (movies NOT affected)</span>
            </div>
          </template>

          <!-- Movies Tab: Show movies reset button -->
          <template v-if="contentType === 'movies'">
            <div class="flex items-center gap-3">
              <button
                @click="resetMovies"
                :disabled="resetting"
                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {{ resetting ? 'Resetting...' : 'Reset All Movies' }}
              </button>
              <span class="text-sm text-gray-500">Delete all movies and STRM files (TV channels NOT affected)</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!-- Duplicate Strategy Modal -->
  <DuplicateStrategyModal
    :show="showDuplicateModal"
    :analysis="analysisResult"
    @close="handleDuplicateModalClose"
    @confirm="handleDuplicateStrategyConfirm"
  />
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import axios from 'axios'
import DuplicateStrategyModal from '../components/DuplicateStrategyModal.vue'

const contentType = ref('channels') // 'channels' or 'movies'
const importMode = ref('upload')
const selectedFile = ref(null)
const fileInput = ref(null)
const m3uUrl = ref('')
const importing = ref(false)
const resetting = ref(false)
const statusMessage = ref('')
const statusType = ref('')
const importStats = ref(null)
const importJobId = ref(null)
const importProgress = ref({ processed: 0, total: 0 })
const pollInterval = ref(null)
const showDuplicateModal = ref(false)
const analysisResult = ref(null)
const pendingImportType = ref(null) // 'file' or 'url'

const clearFileInput = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Clear status when switching between channels/movies tabs
watch(contentType, () => {
  statusMessage.value = ''
  statusType.value = ''
  importStats.value = null
  clearFileInput()
  m3uUrl.value = ''
})

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
    console.log('[ImportView] Polling job status for:', jobId)
    const response = await axios.get(`/api/movies/jobs/${jobId}`)
    const job = response.data.job || response.data  // Handle both formats
    console.log('[ImportView] Job status response:', job)

    if (job) {
      importProgress.value = {
        processed: job.processed || 0,
        total: job.total || 0
      }
      console.log('[ImportView] Progress updated:', importProgress.value)

      if (job.status === 'completed') {
        console.log('[ImportView] Job completed!')
        stopPolling()
        importing.value = false
        statusType.value = 'success'
        statusMessage.value = `Import completed: ${job.created || 0} created, ${job.updated || 0} updated`
        importStats.value = {
          total: job.total,
          new: job.created,
          updated: job.updated,
          deleted: job.deleted,
          skipped: job.skipped
        }
      } else if (job.status === 'failed') {
        console.log('[ImportView] Job failed:', job.error)
        stopPolling()
        importing.value = false
        statusType.value = 'error'
        statusMessage.value = job.error || 'Import failed'
      }
    }
  } catch (error) {
    console.error('[ImportView] Failed to poll job status:', error)
  }
}

const startPolling = (jobId) => {
  console.log('[ImportView] Starting polling for jobId:', jobId)
  importJobId.value = jobId
  pollInterval.value = setInterval(() => {
    pollJobStatus(jobId)
  }, 500) // Poll every 500ms
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

  // Movies don't need duplicate analysis (skip strategy modal)
  if (contentType.value === 'movies') {
    await performImport('file')
    return
  }

  // Channels: Analyze first
  importing.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await axios.post('/api/import/channels/analyze', formData)

    analysisResult.value = response.data
    pendingImportType.value = 'file'
    showDuplicateModal.value = true
    importing.value = false
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Analysis failed'
    importing.value = false
  }
}

const performImport = async (type, duplicateStrategy = 'replace') => {
  importing.value = true
  statusMessage.value = ''
  importStats.value = null
  importProgress.value = { processed: 0, total: 0 }

  try {
    let response
    if (type === 'file') {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      if (contentType.value === 'channels' && duplicateStrategy) {
        formData.append('duplicateStrategy', duplicateStrategy)
      }

      const endpoint = contentType.value === 'channels'
        ? '/api/import/channels/upload'
        : '/api/import/movies/upload'

      response = await axios.post(endpoint, formData)
      clearFileInput()
    } else { // url
      const endpoint = contentType.value === 'channels'
        ? '/api/import/channels/url'
        : '/api/import/movies/url'

      const payload = { url: m3uUrl.value }
      if (contentType.value === 'channels' && duplicateStrategy) {
        payload.duplicateStrategy = duplicateStrategy
      }

      response = await axios.post(endpoint, payload)
      m3uUrl.value = ''
    }

    // New API returns jobId - start polling
    if (response.data.jobId) {
      console.log('[ImportView] Import started with jobId:', response.data.jobId, 'total:', response.data.total)
      importProgress.value.total = response.data.total
      startPolling(response.data.jobId)
    } else {
      // Legacy response format (shouldn't happen with new API)
      console.log('[ImportView] Legacy response format received')
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

  // Movies don't need duplicate analysis (skip strategy modal)
  if (contentType.value === 'movies') {
    await performImport('url')
    return
  }

  // Channels: Analyze first
  importing.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const response = await axios.post('/api/import/channels/analyze-url', { url: m3uUrl.value })

    analysisResult.value = response.data
    pendingImportType.value = 'url'
    showDuplicateModal.value = true
    importing.value = false
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Analysis failed'
    importing.value = false
  }
}

const handleDuplicateStrategyConfirm = async (strategy) => {
  showDuplicateModal.value = false
  await performImport(pendingImportType.value, strategy)
}

const handleDuplicateModalClose = () => {
  showDuplicateModal.value = false
  importing.value = false
}

const resetChannels = async () => {
  if (!confirm('⚠️ WARNING: This will delete ALL channels and EPG mappings!\n\nGroups will be preserved.\n\nAre you sure?')) {
    return
  }

  resetting.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const response = await axios.post('/api/channels/reset/all')
    statusType.value = 'success'
    statusMessage.value = response.data.message
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Reset failed'
  } finally {
    resetting.value = false
  }
}

const resetGroups = async () => {
  if (!confirm('⚠️ WARNING: This will delete ALL groups (except Unassigned)!\n\nAll channels will be moved to Unassigned group.\n\nAre you sure?')) {
    return
  }

  resetting.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const response = await axios.post('/api/groups/reset/all')
    statusType.value = 'success'
    statusMessage.value = response.data.message
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Reset failed'
  } finally {
    resetting.value = false
  }
}

const resetEpgMappings = async () => {
  if (!confirm('⚠️ This will delete ALL EPG mappings!\n\nChannels and groups will be preserved.\n\nYou will need to re-run auto-matching.\n\nAre you sure?')) {
    return
  }

  resetting.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const response = await axios.post('/api/reset/epg-mappings')
    statusType.value = 'success'
    statusMessage.value = response.data.message
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Reset failed'
  } finally {
    resetting.value = false
  }
}

const resetMovies = async () => {
  if (!confirm('⚠️ WARNING: This will delete ALL movies and STRM files!\n\nTV channels and groups will NOT be affected.\n\nAre you sure?')) {
    return
  }

  resetting.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const response = await axios.post('/api/movies/reset/all')
    statusType.value = 'success'
    statusMessage.value = response.data.message
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Reset failed'
  } finally {
    resetting.value = false
  }
}

const resetAllTvData = async () => {
  if (!confirm('🚨 EXTREME DANGER 🚨\n\nThis will delete ALL TV data:\n- All channels\n- All groups (except Unassigned)\n- All EPG mappings\n\nMovies will NOT be affected.\n\nThis action CANNOT be undone!\n\nAre you ABSOLUTELY sure?')) {
    return
  }

  if (!confirm('LAST WARNING: Click OK to permanently delete all TV data.\n\nThere is NO going back!')) {
    return
  }

  resetting.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const response = await axios.post('/api/reset/tv-all')
    statusType.value = 'success'
    statusMessage.value = response.data.message
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Reset failed'
  } finally {
    resetting.value = false
  }
}

const resetAll = async () => {
  if (!confirm('🚨 EXTREME DANGER 🚨\n\nThis will delete EVERYTHING:\n- All channels\n- All groups (except Unassigned)\n- All movies\n- All STRM files\n- All EPG mappings\n\nThis action CANNOT be undone!\n\nAre you ABSOLUTELY sure?')) {
    return
  }

  if (!confirm('LAST WARNING: Click OK to permanently delete everything.\n\nThere is NO going back!')) {
    return
  }

  resetting.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const response = await axios.post('/api/reset/all')
    statusType.value = 'success'
    statusMessage.value = response.data.message
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Reset failed'
  } finally {
    resetting.value = false
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  stopPolling()
})
</script>
