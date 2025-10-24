<template>
  <div>
    <!-- Year Organization Toggle -->
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow p-6 mb-6 border border-purple-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-purple-100 rounded-full p-3">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Year-Based Organization</h3>
            <p class="text-sm text-gray-600 mt-1">
              Organize movies into subdirectories by release year periods
            </p>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="yearOrgEnabled"
            @change="toggleYearOrganization"
            class="sr-only peer"
          />
          <div class="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      <!-- Status Message -->
      <div v-if="yearOrgEnabled" class="mt-4 p-3 bg-purple-100 rounded-lg">
        <p class="text-sm text-purple-800">
          ✓ Movies will be organized into subdirectories based on year ranges below. Structure:
          <code class="font-mono text-xs bg-purple-200 px-2 py-1 rounded">/{year_library}/{movie_name}/{movie_name}.strm</code>
        </p>
      </div>
      <div v-else class="mt-4 p-3 bg-gray-100 rounded-lg">
        <p class="text-sm text-gray-700">
          Movies use flat structure:
          <code class="font-mono text-xs bg-gray-200 px-2 py-1 rounded">/{movie_name}/{movie_name}.strm</code>
        </p>
      </div>
    </div>

    <!-- Year Libraries List -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Year Libraries Configuration</h3>
          <p class="text-sm text-gray-600 mt-1">Define year ranges for organizing your movie collection</p>
        </div>
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Library
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        <p class="mt-4 text-gray-600">Loading year libraries...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="libraries.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p class="mt-4 text-gray-600">No year libraries configured</p>
        <button
          @click="showAddModal = true"
          class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Create First Library
        </button>
      </div>

      <!-- Libraries Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Range</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Directory</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movies</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="library in libraries" :key="library.id" :class="{ 'opacity-50': !library.enabled }">
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="toggleLibrary(library)"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    library.enabled ? 'bg-purple-600' : 'bg-gray-300'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      library.enabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  ></span>
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ library.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-700">
                  {{ formatYearRange(library.year_from, library.year_to) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <code class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{{ library.directory }}</code>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600">
                  {{ getMovieCount(library.name) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editLibrary(library)"
                  class="text-purple-600 hover:text-purple-900 mr-3"
                >
                  Edit
                </button>
                <button
                  @click="deleteLibrary(library)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Load Statistics Button (when stats not loaded) -->
      <div v-if="!stats && libraries.length > 0 && !loadingStats" class="mt-6 pt-6 border-t border-gray-200 text-center">
        <button
          @click="loadStats"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Load Distribution Statistics
        </button>
        <p class="text-xs text-gray-500 mt-2">
          This analyzes all movies to show distribution across year libraries
        </p>
      </div>

      <!-- Loading Stats -->
      <div v-if="loadingStats" class="mt-6 pt-6 border-t border-gray-200 text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p class="mt-3 text-gray-600">Analyzing movie distribution...</p>
      </div>

      <!-- Statistics -->
      <div v-if="stats && stats.total > 0" class="mt-6 pt-6 border-t border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-gray-700">Distribution Statistics</h4>
          <button
            @click="loadStats"
            class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Refresh Stats
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-xs font-medium text-blue-600 uppercase">Total Movies</p>
            <p class="text-2xl font-bold text-blue-900 mt-1">{{ stats.total.toLocaleString() }}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-xs font-medium text-green-600 uppercase">Organized</p>
            <p class="text-2xl font-bold text-green-900 mt-1">{{ stats.organized.toLocaleString() }}</p>
          </div>
          <div class="bg-orange-50 rounded-lg p-4">
            <p class="text-xs font-medium text-orange-600 uppercase">Unorganized</p>
            <p class="text-2xl font-bold text-orange-900 mt-1">{{ stats.unorganized.toLocaleString() }}</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <p class="text-xs font-medium text-purple-600 uppercase">Coverage</p>
            <p class="text-2xl font-bold text-purple-900 mt-1">
              {{ Math.round((stats.organized / stats.total) * 100) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || editingLibrary" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ editingLibrary ? 'Edit Year Library' : 'Add Year Library' }}
          </h3>

          <div class="space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                v-model="formData.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 1990s Movies"
              />
            </div>

            <!-- Year From -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Year From (leave empty for no lower bound)
              </label>
              <input
                v-model.number="formData.year_from"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 1990"
                min="1900"
                max="2100"
              />
            </div>

            <!-- Year To -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Year To (leave empty for no upper bound)
              </label>
              <input
                v-model.number="formData.year_to"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 1999"
                min="1900"
                max="2100"
              />
            </div>

            <!-- Directory -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Directory Name</label>
              <input
                v-model="formData.directory"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                placeholder="e.g., 1990s"
              />
              <p class="mt-1 text-xs text-gray-500">No spaces, lowercase recommended</p>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              @click="saveLibrary"
              :disabled="!isFormValid"
              class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ editingLibrary ? 'Update' : 'Create' }}
            </button>
            <button
              @click="closeModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'YearLibrariesTab',
  data() {
    return {
      loading: false,
      loadingStats: false,
      yearOrgEnabled: false,
      libraries: [],
      stats: null,
      showAddModal: false,
      editingLibrary: null,
      formData: {
        name: '',
        year_from: null,
        year_to: null,
        directory: ''
      }
    };
  },
  computed: {
    isFormValid() {
      return this.formData.name && this.formData.directory;
    }
  },
  async mounted() {
    await this.loadConfig();
    await this.loadLibraries();
    // Load stats only if there are movies (lazy loading to improve performance)
    // Stats will be loaded after library operations (add/edit/delete/toggle)
  },
  methods: {
    async loadConfig() {
      try {
        const response = await fetch('/api/year-libraries/config');
        const data = await response.json();
        if (data.success) {
          this.yearOrgEnabled = data.enabled;
        }
      } catch (error) {
        console.error('Error loading year organization config:', error);
      }
    },
    async toggleYearOrganization() {
      try {
        const response = await fetch('/api/year-libraries/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: this.yearOrgEnabled })
        });

        const data = await response.json();
        if (data.success) {
          this.$emit('toast', {
            type: 'success',
            message: `Year organization ${this.yearOrgEnabled ? 'enabled' : 'disabled'}`
          });
        }
      } catch (error) {
        console.error('Error toggling year organization:', error);
        this.$emit('toast', {
          type: 'error',
          message: 'Failed to update year organization'
        });
        // Revert toggle
        this.yearOrgEnabled = !this.yearOrgEnabled;
      }
    },
    async loadLibraries() {
      this.loading = true;
      try {
        const response = await fetch('/api/year-libraries');
        const data = await response.json();
        if (data.success) {
          this.libraries = data.libraries;
        }
      } catch (error) {
        console.error('Error loading year libraries:', error);
        this.$emit('toast', {
          type: 'error',
          message: 'Failed to load year libraries'
        });
      } finally {
        this.loading = false;
      }
    },
    async loadStats() {
      this.loadingStats = true;
      try {
        const response = await fetch('/api/year-libraries/stats');
        const data = await response.json();
        if (data.success) {
          this.stats = data.stats;
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        this.$emit('toast', {
          type: 'error',
          message: 'Failed to load statistics'
        });
      } finally {
        this.loadingStats = false;
      }
    },
    formatYearRange(yearFrom, yearTo) {
      if (yearFrom === null && yearTo === null) {
        return 'Unknown';
      }
      if (yearFrom === null) {
        return `≤ ${yearTo}`;
      }
      if (yearTo === null) {
        return `${yearFrom}+`;
      }
      return `${yearFrom} - ${yearTo}`;
    },
    getMovieCount(libraryName) {
      if (!this.stats || !this.stats.byLibrary) return '0';
      const lib = this.stats.byLibrary[libraryName];
      return lib ? lib.count.toLocaleString() : '0';
    },
    editLibrary(library) {
      this.editingLibrary = library;
      this.formData = {
        name: library.name,
        year_from: library.year_from,
        year_to: library.year_to,
        directory: library.directory
      };
    },
    closeModal() {
      this.showAddModal = false;
      this.editingLibrary = null;
      this.formData = {
        name: '',
        year_from: null,
        year_to: null,
        directory: ''
      };
    },
    async saveLibrary() {
      try {
        const url = this.editingLibrary
          ? `/api/year-libraries/${this.editingLibrary.id}`
          : '/api/year-libraries';
        const method = this.editingLibrary ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.formData)
        });

        const data = await response.json();
        if (data.success) {
          this.$emit('toast', {
            type: 'success',
            message: data.message
          });
          this.closeModal();
          await this.loadLibraries();
          await this.loadStats();
        } else {
          this.$emit('toast', {
            type: 'error',
            message: data.error || 'Failed to save library'
          });
        }
      } catch (error) {
        console.error('Error saving library:', error);
        this.$emit('toast', {
          type: 'error',
          message: 'Failed to save library'
        });
      }
    },
    async deleteLibrary(library) {
      if (!confirm(`Delete year library "${library.name}"?\n\nThis will not delete any movie files, only the configuration.`)) {
        return;
      }

      try {
        const response = await fetch(`/api/year-libraries/${library.id}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
          this.$emit('toast', {
            type: 'success',
            message: 'Library deleted successfully'
          });
          await this.loadLibraries();
          await this.loadStats();
        }
      } catch (error) {
        console.error('Error deleting library:', error);
        this.$emit('toast', {
          type: 'error',
          message: 'Failed to delete library'
        });
      }
    },
    async toggleLibrary(library) {
      try {
        const response = await fetch(`/api/year-libraries/${library.id}/toggle`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !library.enabled })
        });

        const data = await response.json();
        if (data.success) {
          library.enabled = !library.enabled;
          this.$emit('toast', {
            type: 'success',
            message: data.message
          });
          // Stats will need manual refresh after toggling
        }
      } catch (error) {
        console.error('Error toggling library:', error);
        this.$emit('toast', {
          type: 'error',
          message: 'Failed to toggle library'
        });
      }
    }
  }
};
</script>
