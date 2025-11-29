<template>
  <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
    <h2 class="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
      <svg class="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      Import M3U Playlist
    </h2>
    <p class="text-sm text-gray-600 mb-4">
      Import channels from M3U playlist files or URLs
    </p>

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

  <!-- Duplicate Strategy Modal -->
  <DuplicateStrategyModal
    :show="showDuplicateModal"
    :analysis="analysisResult"
    @close="handleDuplicateModalClose"
    @confirm="handleDuplicateStrategyConfirm"
  />
</template>

<script>
import axios from 'axios';
import DuplicateStrategyModal from '../shared/DuplicateStrategyModal.vue';
import { useToast } from '../../composables/useToast';

export default {
  name: 'ChannelsImportSettings',
  components: {
    DuplicateStrategyModal
  },
  setup() {
    const { addToast } = useToast();
    return { addToast };
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
      pendingImportType: null
    };
  },
  computed: {
    progressPercentage() {
      if (!this.importProgress.total) return 0;
      return Math.round((this.importProgress.processed / this.importProgress.total) * 100);
    }
  },
  beforeUnmount() {
    this.stopPolling();
  },
  methods: {
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
    }
  }
};
</script>
