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
              @click="$refs.fileInput.click()"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Select File
            </button>
          </div>
          <div v-else>
            <p class="text-gray-900 font-medium">{{ selectedFile.name }}</p>
            <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            <button
              @click="selectedFile = null"
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

      <!-- Status message -->
      <div v-if="statusMessage" :class="statusType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'" class="mt-4 p-4 rounded-md">
        <p class="font-medium">{{ statusMessage }}</p>
        <div v-if="importStats" class="text-sm mt-2 space-y-1">
          <!-- Channels stats -->
          <p v-if="importStats.total !== undefined">
            Total: {{ importStats.total }} | New: {{ importStats.new }} | Updated: {{ importStats.updated }}
          </p>
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
          <div class="flex items-center gap-3">
            <button
              @click="resetAll"
              :disabled="resetting"
              class="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold"
            >
              {{ resetting ? 'Resetting...' : 'Reset Everything' }}
            </button>
            <span class="text-sm text-red-600 font-semibold">⚠️ Delete ALL: channels, groups, and EPG mappings</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const contentType = ref('channels') // 'channels' or 'movies'
const importMode = ref('upload')
const selectedFile = ref(null)
const m3uUrl = ref('')
const importing = ref(false)
const resetting = ref(false)
const statusMessage = ref('')
const statusType = ref('')
const importStats = ref(null)

// Clear status when switching between channels/movies tabs
watch(contentType, () => {
  statusMessage.value = ''
  statusType.value = ''
  importStats.value = null
  selectedFile.value = null
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

const uploadFile = async () => {
  if (!selectedFile.value) return

  importing.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    // Use appropriate endpoint based on content type
    const endpoint = contentType.value === 'channels'
      ? '/api/import/channels/upload'
      : '/api/import/movies/upload'

    const response = await axios.post(endpoint, formData)

    statusType.value = 'success'
    statusMessage.value = response.data.message
    importStats.value = response.data.stats
    selectedFile.value = null
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Import failed'
  } finally {
    importing.value = false
  }
}

const importFromUrl = async () => {
  if (!m3uUrl.value) return

  importing.value = true
  statusMessage.value = ''
  importStats.value = null

  try {
    // Use appropriate endpoint based on content type
    const endpoint = contentType.value === 'channels'
      ? '/api/import/channels/url'
      : '/api/import/movies/url'

    const response = await axios.post(endpoint, { url: m3uUrl.value })

    statusType.value = 'success'
    statusMessage.value = response.data.message
    importStats.value = response.data.stats
    m3uUrl.value = ''
  } catch (error) {
    statusType.value = 'error'
    statusMessage.value = error.response?.data?.error || 'Import failed'
  } finally {
    importing.value = false
  }
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

const resetAll = async () => {
  if (!confirm('🚨 EXTREME DANGER 🚨\n\nThis will delete EVERYTHING:\n- All channels\n- All groups (except Unassigned)\n- All EPG mappings\n\nThis action CANNOT be undone!\n\nAre you ABSOLUTELY sure?')) {
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
</script>
