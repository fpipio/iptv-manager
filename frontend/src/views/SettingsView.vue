<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
        <p class="mt-2 text-gray-600">
          Configure IPTV Manager settings and EPG sources
        </p>
      </div>

      <!-- EPG Info Card -->
      <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow p-6 mb-6">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4 flex-1">
            <h3 class="text-lg font-semibold text-blue-900 mb-2">EPG Sources Information</h3>
            <p class="text-sm text-blue-800 mb-3">
              EPG sources are automatically managed by the iptv-org/epg grabber.
              You can find all available sources and their configurations here:
            </p>
            <a
              href="https://github.com/iptv-org/epg/tree/master/sites"
              target="_blank"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Browse EPG Sources on GitHub
            </a>
            <p class="text-xs text-blue-700 mt-3">
              The EPG Matching page allows you to map your channels to these sources for automatic program guide updates.
            </p>
          </div>
        </div>
      </div>

      <!-- Output Streams Card -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center">
          <svg class="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          Output Streams
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          Access your IPTV streams and EPG data through these URLs
        </p>

        <div class="space-y-4">
          <!-- M3U Playlist -->
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-1 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  M3U Playlist
                </h3>
                <code class="text-sm text-gray-700 bg-white px-3 py-2 rounded border block break-all">
                  http://localhost:3000/output/playlist.m3u
                </code>
                <p class="text-xs text-gray-500 mt-2">
                  Your exported M3U playlist with all enabled channels
                </p>
              </div>
              <button
                @click="copyToClipboard('http://localhost:3000/output/playlist.m3u')"
                class="ml-4 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex-shrink-0"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
          </div>

          <!-- EPG XML -->
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-1 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  EPG Guide (XMLTV)
                </h3>
                <code class="text-sm text-gray-700 bg-white px-3 py-2 rounded border block break-all">
                  http://localhost:3000/api/epg/xml
                </code>
                <p class="text-xs text-gray-500 mt-2">
                  Electronic Program Guide in XMLTV format (generated from EPG Matching)
                </p>
              </div>
              <button
                @click="copyToClipboard('http://localhost:3000/api/epg/xml')"
                class="ml-4 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex-shrink-0"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-xs text-yellow-800">
            <strong>Note:</strong> Replace <code class="bg-yellow-100 px-1 rounded">localhost:3000</code> with your server's IP address when accessing from other devices on your network.
          </p>
        </div>
      </div>

      <!-- EPG Configuration Card -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">EPG Configuration</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Days to Grab
            </label>
            <input
              v-model.number="config.grab_days"
              type="number"
              min="1"
              max="14"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              @change="saveConfig"
            />
            <p class="mt-1 text-xs text-gray-500">Number of days of program data to retrieve</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Max Connections
            </label>
            <input
              v-model.number="config.max_connections"
              type="number"
              min="1"
              max="10"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              @change="saveConfig"
            />
            <p class="mt-1 text-xs text-gray-500">Concurrent connections (higher = faster but risky)</p>
          </div>
        </div>
      </div>

      <!-- EPG Sources List -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-semibold">EPG Sources</h2>
            <p class="text-sm text-gray-500 mt-1">Drag to reorder (priority: top = highest)</p>
          </div>
          <button
            @click="showAddSourceModal = true"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Source
          </button>
        </div>

        <div v-if="sources.length === 0" class="text-center py-12 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-4">No EPG sources configured</p>
          <p class="text-sm">Add a source to enable EPG matching</p>
        </div>

        <draggable
          v-else
          v-model="sources"
          @end="onSourceReorder"
          item-key="id"
          handle=".drag-handle"
          class="space-y-3"
        >
          <template #item="{element: source}">
            <div
              :key="source.id"
              class="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div class="flex items-center justify-between">
                <!-- Drag Handle -->
                <div class="flex items-center gap-3">
                  <div class="drag-handle cursor-move text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </div>

                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <h3 class="font-semibold text-gray-900">{{ source.site_name }}</h3>
                    <label class="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        :checked="source.enabled"
                        @change="toggleSourceEnabled(source)"
                        class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span class="ml-2 text-sm text-gray-600">Enabled</span>
                    </label>
                  </div>
                  <div class="mt-2 text-sm text-gray-500">
                    <div v-if="source.site_url">URL: {{ source.site_url }}</div>
                    <div v-if="source.last_grab_at">
                      Last grab: {{ formatDate(source.last_grab_at) }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="editSource(source)"
                    class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteSource(source)"
                    class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- EPG Status Card -->
      <div v-if="status" class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">EPG Status</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div class="text-sm text-gray-500">EPG Data</div>
            <div class="text-lg font-semibold" :class="status.hasEpgData ? 'text-green-600' : 'text-gray-400'">
              {{ status.hasEpgData ? 'Available' : 'Not Available' }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Sources</div>
            <div class="text-lg font-semibold text-gray-900">
              {{ status.sourcesEnabled }} / {{ status.sourcesTotal }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Last Grab</div>
            <div class="text-sm text-gray-900">
              {{ status.lastGrabAt ? formatDate(status.lastGrabAt) : 'Never' }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Success Rate</div>
            <div class="text-lg font-semibold text-gray-900">
              {{ status.recentSuccessRate }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Source Modal -->
    <div
      v-if="showAddSourceModal || editingSource"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeSourceModal"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold mb-4">
          {{ editingSource ? 'Edit Source' : 'Add EPG Source' }}
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Site Name *
            </label>
            <input
              v-model="sourceForm.siteName"
              type="text"
              placeholder="e.g., example.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Must match a site name from <a href="https://github.com/iptv-org/epg/tree/master/sites" target="_blank" class="text-blue-600 hover:underline">iptv-org/epg/sites</a>
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Site URL (optional)
            </label>
            <input
              v-model="sourceForm.siteUrl"
              type="text"
              placeholder="https://example.com/epg"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="sourceForm.enabled"
                type="checkbox"
                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span class="ml-2 text-sm text-gray-700">Enable this source</span>
            </label>
          </div>
        </div>
        <div class="mt-6 flex gap-2 justify-end">
          <button
            @click="closeSourceModal"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="saveSource"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {{ editingSource ? 'Save Changes' : 'Add Source' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import draggable from 'vuedraggable';
import { useToast } from '../composables/useToast';

export default {
  name: 'SettingsView',
  components: {
    draggable
  },
  setup() {
    const { addToast } = useToast();
    return { addToast };
  },
  data() {
    return {
      sources: [],
      config: {
        grab_days: '3',
        max_connections: '1'
      },
      status: null,
      showAddSourceModal: false,
      editingSource: null,
      sourceForm: {
        siteName: '',
        siteUrl: '',
        enabled: true
      }
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const [sourcesRes, configRes, statusRes] = await Promise.all([
          axios.get('http://localhost:3000/api/epg/sources'),
          axios.get('http://localhost:3000/api/epg/config'),
          axios.get('http://localhost:3000/api/epg/status')
        ]);

        // Sort sources by priority (1 = highest = first)
        this.sources = sourcesRes.data.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        this.config = configRes.data;
        this.status = statusRes.data;
      } catch (error) {
        console.error('Error loading settings data:', error);
        this.addToast('Failed to load settings data', 'error');
      }
    },
    async onSourceReorder() {
      try {
        const updates = this.sources.map((source, index) => ({
          id: source.id,
          priority: index + 1
        }));

        for (const update of updates) {
          await axios.put(`http://localhost:3000/api/epg/sources/${update.id}`, {
            priority: update.priority
          });
        }

        this.addToast('EPG sources priority updated', 'success');
      } catch (error) {
        console.error('Error updating sources priority:', error);
        this.addToast('Failed to update sources priority', 'error');
        await this.loadData();
      }
    },
    async saveConfig() {
      try {
        await axios.put('http://localhost:3000/api/epg/config', {
          grab_days: String(this.config.grab_days),
          max_connections: String(this.config.max_connections)
        });
        this.addToast('Configuration saved', 'success');
      } catch (error) {
        console.error('Error saving config:', error);
        this.addToast('Failed to save configuration', 'error');
      }
    },
    async toggleSourceEnabled(source) {
      try {
        await axios.put(`http://localhost:3000/api/epg/sources/${source.id}`, {
          enabled: !source.enabled
        });
        this.addToast(`Source ${source.enabled ? 'disabled' : 'enabled'}`, 'success');
        this.loadData();
      } catch (error) {
        console.error('Error toggling source:', error);
        this.addToast('Failed to toggle source', 'error');
      }
    },
    editSource(source) {
      this.editingSource = source;
      this.sourceForm = {
        siteName: source.site_name,
        siteUrl: source.site_url || '',
        enabled: source.enabled
      };
    },
    async saveSource() {
      if (!this.sourceForm.siteName) {
        this.addToast('Site name is required', 'error');
        return;
      }

      try {
        if (this.editingSource) {
          await axios.put(`http://localhost:3000/api/epg/sources/${this.editingSource.id}`, this.sourceForm);
          this.addToast('Source updated successfully', 'success');
        } else {
          await axios.post('http://localhost:3000/api/epg/sources', this.sourceForm);
          this.addToast('Source added successfully', 'success');
        }
        this.closeSourceModal();
        this.loadData();
      } catch (error) {
        console.error('Error saving source:', error);
        this.addToast(error.response?.data?.error || 'Failed to save source', 'error');
      }
    },
    async deleteSource(source) {
      if (!confirm(`Delete EPG source "${source.site_name}"?`)) return;

      try {
        await axios.delete(`http://localhost:3000/api/epg/sources/${source.id}`);
        this.addToast('Source deleted successfully', 'success');
        this.loadData();
      } catch (error) {
        console.error('Error deleting source:', error);
        this.addToast('Failed to delete source', 'error');
      }
    },
    closeSourceModal() {
      this.showAddSourceModal = false;
      this.editingSource = null;
      this.sourceForm = {
        siteName: '',
        siteUrl: '',
        enabled: true
      };
    },
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.addToast('URL copied to clipboard', 'success', 2000);
      }).catch(() => {
        this.addToast('Failed to copy URL', 'error');
      });
    },
    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleString();
    }
  }
};
</script>
