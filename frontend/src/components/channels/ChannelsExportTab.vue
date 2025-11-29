<template>
  <div class="export-tab">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">📡 M3U Playlist Export</h2>
      <p class="text-gray-600">
        Your playlist is automatically updated when you modify channels or groups.
      </p>
    </div>

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
          @click="copyUrl"
          class="flex-shrink-0 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          title="Copy URL"
        >
          <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- EPG Section -->
    <div class="mt-8 pt-8 border-t border-gray-200">
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
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ChannelsExportTab',
  data() {
    return {
      stats: {
        exists: false,
        groups: 0,
        channels: 0,
        fileSize: '0 KB',
        lastModified: null
      },
      loadingStats: true,
      regenerating: false,
      copied: false,
      copiedEpg: false,
      grabbingEpg: false,
      epgConfig: {},
      toast: {
        show: false,
        message: '',
        type: 'success'
      }
    };
  },
  computed: {
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
    this.loadEpgConfig();
  },
  methods: {
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
          await this.loadStats(); // Reload stats
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

    async copyUrl() {
      try {
        await navigator.clipboard.writeText(this.playlistUrl);
        this.copied = true;
        this.showToast('URL copied to clipboard!', 'success');
        setTimeout(() => {
          this.copied = false;
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

    showToast(message, type = 'success') {
      this.toast = { show: true, message, type };
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },

    async loadEpgConfig() {
      try {
        const response = await fetch('/api/epg/config');
        if (response.ok) {
          this.epgConfig = await response.json();
        }
      } catch (error) {
        console.error('Failed to load EPG config:', error);
        this.epgConfig = { grab_days: '3' }; // Fallback to default
      }
    },

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
        const grabDays = parseInt(this.epgConfig.grab_days) || 3;
        const maxConnections = parseInt(this.epgConfig.max_connections) || 1;
        const timeout = parseInt(this.epgConfig.timeout_ms) || 60000;

        const response = await axios.post('/api/epg/grab-custom', {
          days: grabDays,
          maxConnections: maxConnections,
          timeout: timeout
        });

        this.showToast(`EPG grab completed! Channels: ${response.data.channelsGrabbed}, Programs: ${response.data.programsGrabbed}`, 'success');
      } catch (error) {
        console.error('Error grabbing EPG:', error);
        this.showToast('Failed to grab EPG: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        this.grabbingEpg = false;
      }
    }
  }
};
</script>

<style scoped>
.export-tab {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
