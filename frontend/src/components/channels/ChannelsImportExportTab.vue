<template>
  <div class="space-y-8">
    <!-- ========== IMPORT SECTION ========== -->
    <div class="border-b border-gray-200 pb-8">
      <h2 class="text-2xl font-bold mb-4">📥 Import M3U Playlist</h2>

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
          </div>
        </div>
      </div>
    </div>

    <!-- ========== EXPORT SECTION ========== -->
    <div class="border-b border-gray-200 pb-8">
      <h2 class="text-2xl font-bold mb-4">📡 M3U Playlist Export</h2>
      <p class="text-gray-600 mb-6">
        Your playlist is automatically updated when you modify channels or groups.
      </p>

      <!-- Playlist URL Card -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-2 flex items-center">
          <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Playlist URL
        </h3>
        <p class="text-sm text-gray-500 mb-3">
          Use this URL in your IPTV player (VLC, Kodi, Perfect Player, etc.)
        </p>

        <!-- URL Box -->
        <div class="bg-gray-50 rounded-md p-3 mb-3 border border-gray-200 flex items-center">
          <code class="text-sm text-gray-800 flex-1 break-all mr-2">{{ playlistUrl }}</code>
          <button
            @click="copyPlaylistUrl"
            class="flex-shrink-0 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            title="Copy URL"
          >
            <svg v-if="!copiedPlaylist" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        <!-- Last Updated -->
        <p class="text-xs text-gray-400">
          <span v-if="stats.lastModified">
            Last updated: {{ formatDate(stats.lastModified) }} (auto-generated)
          </span>
          <span v-else>
            No playlist generated yet. Import or modify channels to generate.
          </span>
        </p>
      </div>

      <!-- Statistics Card -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Playlist Statistics
        </h3>

        <div v-if="loadingStats" class="text-center py-4">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p class="text-sm text-gray-500 mt-2">Loading statistics...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-3xl font-bold text-blue-600">{{ stats.groups || 0 }}</div>
            <div class="text-sm text-gray-600 mt-1">Groups</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-3xl font-bold text-green-600">{{ stats.channels || 0 }}</div>
            <div class="text-sm text-gray-600 mt-1">Channels</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <div class="text-3xl font-bold text-purple-600">{{ stats.fileSize || '0 KB' }}</div>
            <div class="text-sm text-gray-600 mt-1">File Size</div>
          </div>
        </div>

        <div v-if="!stats.exists && !loadingStats" class="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p class="text-sm text-yellow-800">
            ⚠️ No playlist file found. Import channels or make changes to generate the playlist automatically.
          </p>
        </div>
      </div>

      <!-- Actions Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Actions</h3>

        <div class="space-y-3">
          <!-- Download Button -->
          <a
            :href="playlistUrl"
            download="playlist.m3u"
            class="block w-full text-center bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            <svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download M3U File
          </a>

          <!-- Force Regenerate Button -->
          <button
            @click="forceRegenerate"
            :disabled="regenerating"
            class="block w-full bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <svg v-if="!regenerating" class="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div v-else class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {{ regenerating ? 'Regenerating...' : 'Force Regenerate' }}
          </button>
          <p class="text-xs text-gray-500 text-center">
            Use this if playlist is out of sync (normally not needed)
          </p>
        </div>
      </div>
    </div>

    <!-- ========== EPG SECTION ========== -->
    <div>
      <h2 class="text-2xl font-bold mb-4">📅 EPG Guide</h2>
      <p class="text-gray-600 mb-6">
        Electronic Program Guide in XMLTV format
      </p>

      <!-- EPG URL Card -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-2 flex items-center">
          <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          EPG URL
        </h3>
        <p class="text-sm text-gray-500 mb-3">
          Use this URL in your IPTV player for program guide data
        </p>

        <!-- URL Box -->
        <div class="bg-gray-50 rounded-md p-3 mb-3 border border-gray-200 flex items-center">
          <code class="text-sm text-gray-800 flex-1 break-all mr-2">{{ epgUrl }}</code>
          <button
            @click="copyEpgUrl"
            class="flex-shrink-0 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            title="Copy URL"
          >
            <svg v-if="!copiedEpg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Grab EPG Data Button -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">EPG Data</h3>
        <button
          @click="grabEpgData"
          :disabled="grabbingEpg"
          class="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <span v-if="grabbingEpg" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Grabbing EPG Data...
          </span>
          <span v-else>Grab EPG Data</span>
        </button>
        <p class="text-xs text-gray-500 mt-2 text-center">
          Fetch program guide data for mapped channels (may take several minutes)
        </p>
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

  <!-- Toast Notification -->
  <div
    v-if="toast.show"
    class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border-l-4 transition-all z-50"
    :class="toast.type === 'success' ? 'border-green-500' : 'border-red-500'"
  >
    <div class="flex items-start">
      <svg v-if="toast.type === 'success'" class="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <svg v-else class="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <p class="text-sm text-gray-800">{{ toast.message }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import DuplicateStrategyModal from '../shared/DuplicateStrategyModal.vue';

export default {
  name: 'ChannelsImportExportTab',
  components: {
    DuplicateStrategyModal
  },
  data() {
    return {
      // Import vars
      importMode: 'upload',
      selectedFile: null,
      m3uUrl: '',
      importing: false,
      statusMessage: '',
      statusType: '',
      importStats: null,
      importJobId: null,
      importProgress: { processed: 0, total: 0 },
      pollInterval: null,
      showDuplicateModal: false,
      analysisResult: null,
      pendingImportType: null,

      // Export vars
      stats: {
        exists: false,
        groups: 0,
        channels: 0,
        fileSize: '0 KB',
        lastModified: null
      },
      loadingStats: true,
      regenerating: false,
      copiedPlaylist: false,
      copiedEpg: false,

      // EPG vars
      grabbingEpg: false,

      // Toast
      toast: {
        show: false,
        message: '',
        type: 'success'
      }
    };
  },
  computed: {
    progressPercentage() {
      if (!this.importProgress.total) return 0;
      return Math.round((this.importProgress.processed / this.importProgress.total) * 100);
    },
    playlistUrl() {
      const baseUrl = window.location.origin;
      return `${baseUrl}/output/playlist.m3u`;
    },
    epgUrl() {
      const baseUrl = window.location.origin;
      return `${baseUrl}/api/epg/xml`;
    }
  },
  mounted() {
    this.loadStats();
  },
  beforeUnmount() {
    this.stopPolling();
  },
  methods: {
    // ========== IMPORT METHODS ==========
    clearFileInput() {
      this.selectedFile = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file && (file.name.endsWith('.m3u') || file.name.endsWith('.m3u8'))) {
        this.selectedFile = file;
      }
    },
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
    async pollJobStatus(jobId) {
      try {
        const response = await axios.get(`/api/movies/jobs/${jobId}`);
        const job = response.data.job || response.data;

        if (job) {
          this.importProgress = {
            processed: job.processed || 0,
            total: job.total || 0
          };

          if (job.status === 'completed') {
            this.stopPolling();
            this.importing = false;
            this.statusType = 'success';
            this.statusMessage = `Import completed: ${job.created || 0} created, ${job.updated || 0} updated`;
            this.importStats = {
              total: job.total,
              new: job.created,
              updated: job.updated,
              deleted: job.deleted,
              skipped: job.skipped
            };
          } else if (job.status === 'failed') {
            this.stopPolling();
            this.importing = false;
            this.statusType = 'error';
            this.statusMessage = job.error || 'Import failed';
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    },
    startPolling(jobId) {
      this.importJobId = jobId;
      this.pollInterval = setInterval(() => {
        this.pollJobStatus(jobId);
      }, 500);
    },
    stopPolling() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      this.importJobId = null;
    },
    async uploadFile() {
      if (!this.selectedFile) return;

      this.importing = true;
      this.statusMessage = '';
      this.importStats = null;

      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const response = await axios.post('/api/import/channels/analyze', formData);

        this.analysisResult = response.data;
        this.pendingImportType = 'file';
        this.showDuplicateModal = true;
        this.importing = false;
      } catch (error) {
        this.statusType = 'error';
        this.statusMessage = error.response?.data?.error || 'Analysis failed';
        this.importing = false;
      }
    },
    async performImport(type, duplicateStrategy = 'replace') {
      this.importing = true;
      this.statusMessage = '';
      this.importStats = null;
      this.importProgress = { processed: 0, total: 0 };

      try {
        let response;
        if (type === 'file') {
          const formData = new FormData();
          formData.append('file', this.selectedFile);
          formData.append('duplicateStrategy', duplicateStrategy);

          response = await axios.post('/api/import/channels/upload', formData);
          this.clearFileInput();
        } else {
          response = await axios.post('/api/import/channels/url', {
            url: this.m3uUrl,
            duplicateStrategy
          });
          this.m3uUrl = '';
        }

        if (response.data.jobId) {
          this.importProgress.total = response.data.total;
          this.startPolling(response.data.jobId);
        } else {
          this.statusType = 'success';
          this.statusMessage = response.data.message;
          this.importStats = response.data.stats;
          this.importing = false;
        }
      } catch (error) {
        this.statusType = 'error';
        this.statusMessage = error.response?.data?.error || 'Import failed';
        this.importing = false;
      }
    },
    async importFromUrl() {
      if (!this.m3uUrl) return;

      this.importing = true;
      this.statusMessage = '';
      this.importStats = null;

      try {
        const response = await axios.post('/api/import/channels/analyze-url', { url: this.m3uUrl });

        this.analysisResult = response.data;
        this.pendingImportType = 'url';
        this.showDuplicateModal = true;
        this.importing = false;
      } catch (error) {
        this.statusType = 'error';
        this.statusMessage = error.response?.data?.error || 'Analysis failed';
        this.importing = false;
      }
    },
    async handleDuplicateStrategyConfirm(strategy) {
      this.showDuplicateModal = false;
      await this.performImport(this.pendingImportType, strategy);
    },
    handleDuplicateModalClose() {
      this.showDuplicateModal = false;
      this.importing = false;
    },

    // ========== EXPORT METHODS ==========
    async loadStats() {
      this.loadingStats = true;
      try {
        const response = await fetch('/api/export/stats');
        if (response.ok) {
          this.stats = await response.json();
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        this.loadingStats = false;
      }
    },
    async forceRegenerate() {
      this.regenerating = true;
      try {
        const response = await fetch('/api/export', { method: 'POST' });
        if (response.ok) {
          this.showToast('Playlist regenerated successfully!', 'success');
          await this.loadStats();
        } else {
          throw new Error('Failed to regenerate playlist');
        }
      } catch (error) {
        console.error('Regenerate error:', error);
        this.showToast('Failed to regenerate playlist', 'error');
      } finally {
        this.regenerating = false;
      }
    },
    async copyPlaylistUrl() {
      try {
        await navigator.clipboard.writeText(this.playlistUrl);
        this.copiedPlaylist = true;
        this.showToast('Playlist URL copied to clipboard!', 'success');
        setTimeout(() => {
          this.copiedPlaylist = false;
        }, 2000);
      } catch (error) {
        console.error('Copy failed:', error);
        this.showToast('Failed to copy URL', 'error');
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'Never';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

      return date.toLocaleString();
    },

    // ========== EPG METHODS ==========
    async copyEpgUrl() {
      try {
        await navigator.clipboard.writeText(this.epgUrl);
        this.copiedEpg = true;
        this.showToast('EPG URL copied to clipboard!', 'success');
        setTimeout(() => {
          this.copiedEpg = false;
        }, 2000);
      } catch (error) {
        console.error('Copy failed:', error);
        this.showToast('Failed to copy URL', 'error');
      }
    },
    async grabEpgData() {
      this.grabbingEpg = true;
      try {
        const response = await axios.post('/api/epg/grab-custom', {
          days: 1,
          maxConnections: 1,
          timeout: 60000
        });

        this.showToast(`EPG grab completed! Channels: ${response.data.channelsGrabbed}, Programs: ${response.data.programsGrabbed}`, 'success');
      } catch (error) {
        console.error('Error grabbing EPG:', error);
        this.showToast('Failed to grab EPG: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        this.grabbingEpg = false;
      }
    },

    // ========== TOAST METHODS ==========
    showToast(message, type = 'success') {
      this.toast = { show: true, message, type };
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    }
  }
};
</script>
