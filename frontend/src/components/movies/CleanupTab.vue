<template>
  <div class="space-y-6">
    <!-- Header with Stats -->
    <div class="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">🧹 Movie Name Cleanup</h2>
          <p class="text-orange-100">Automatically remove actor names from movie titles for better Emby/Plex matching</p>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold">{{ cleanupStats.totalCleaned || 0 }}</div>
          <div class="text-sm text-orange-100">Movies Cleaned</div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center gap-4 flex-wrap">
        <button
          @click="analyzeMovies"
          :disabled="isAnalyzing"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
        >
          <svg v-if="isAnalyzing" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <span>{{ isAnalyzing ? 'Analyzing...' : 'Analyze Movies' }}</span>
        </button>

        <button
          @click="showPatternManager = !showPatternManager"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
          </svg>
          <span>Manage Patterns ({{ cleanupStats.totalPatterns }})</span>
        </button>

        <div v-if="filteredSuggestions.length > 0" class="flex items-center gap-3 ml-auto">
          <span class="text-sm font-medium text-gray-700">
            Found {{ filteredSuggestions.length }} movies to clean
          </span>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              v-model="selectAll"
              @change="toggleSelectAll"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="font-medium text-gray-700">Select All</span>
          </label>
          <button
            @click="applyCleanup"
            :disabled="isApplying || selectedMovies.size === 0"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            <svg v-if="isApplying" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isApplying ? 'Applying...' : `Apply Cleanup (${selectedMovies.size})` }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pattern Manager -->
    <div v-if="showPatternManager" class="bg-white rounded-lg shadow p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Pattern Management</h3>
        <button
          @click="showPatternManager = false"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Add New Pattern -->
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 class="text-sm font-semibold text-purple-900 mb-3">Add New Actor</h4>
        <div class="flex gap-3">
          <input
            v-model="newPatternValue"
            type="text"
            placeholder="e.g., Anthony Hopkins"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            @keyup.enter="addPattern"
          />
          <input
            v-model="newPatternDescription"
            type="text"
            placeholder="Description (optional)"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            @keyup.enter="addPattern"
          />
          <button
            @click="addPattern"
            :disabled="!newPatternValue.trim() || isAddingPattern"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
          >
            {{ isAddingPattern ? 'Adding...' : 'Add' }}
          </button>
        </div>
      </div>

      <!-- Patterns List -->
      <div class="max-h-96 overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <th class="px-4 py-2 text-left font-semibold text-gray-700">Actor Name</th>
              <th class="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
              <th class="px-4 py-2 text-center font-semibold text-gray-700">Type</th>
              <th class="px-4 py-2 text-center font-semibold text-gray-700">Status</th>
              <th class="px-4 py-2 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="pattern in patterns" :key="pattern.id" class="hover:bg-gray-50">
              <td class="px-4 py-2 font-medium">{{ pattern.value }}</td>
              <td class="px-4 py-2 text-gray-600">{{ pattern.description || '-' }}</td>
              <td class="px-4 py-2 text-center">
                <span :class="pattern.is_default ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium">
                  {{ pattern.is_default ? 'Default' : 'Custom' }}
                </span>
              </td>
              <td class="px-4 py-2 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="togglePatternStatus(pattern)"
                    :class="pattern.enabled ? 'bg-green-500' : 'bg-gray-300'"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    :title="pattern.enabled ? 'Click to disable' : 'Click to enable'"
                  >
                    <span :class="pattern.enabled ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                  </button>
                  <span :class="pattern.enabled ? 'text-green-700 font-semibold' : 'text-gray-500'" class="text-xs">
                    {{ pattern.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-2 text-center">
                <button
                  v-if="!pattern.is_default"
                  @click="deletePattern(pattern.id)"
                  class="text-red-600 hover:text-red-800"
                  title="Delete custom pattern"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
                <span v-else class="text-gray-400 text-xs">Default</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Category Filters -->
    <div v-if="allSuggestions.length > 0" class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center gap-4 flex-wrap">
        <h3 class="text-sm font-semibold text-gray-700">Filter by Category:</h3>
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            v-model="selectAllCategories"
            @change="toggleAllCategories"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="font-medium text-gray-700">All Categories</span>
        </label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="category in availableCategories"
            :key="category.name"
            class="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
            :class="{ 'bg-blue-50 border-blue-500': selectedCategories.has(category.name) }"
          >
            <input
              type="checkbox"
              :checked="selectedCategories.has(category.name)"
              @change="toggleCategory(category.name)"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="font-medium">{{ category.name }}</span>
            <span class="text-gray-500">({{ category.count }})</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Suggestions Table -->
    <div v-if="filteredSuggestions.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-100 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                Select
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Original Name
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                →
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Cleaned Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Actor
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Year
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                Group
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="suggestion in paginatedSuggestions"
              :key="suggestion.id"
              class="hover:bg-gray-50 transition-colors"
              :class="{ 'bg-blue-50': selectedMovies.has(suggestion.id) }"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <input
                  type="checkbox"
                  :checked="selectedMovies.has(suggestion.id)"
                  @change="toggleSelection(suggestion.id)"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 font-mono">
                {{ suggestion.tvgName }}
              </td>
              <td class="px-4 py-3 text-center">
                <svg class="w-5 h-5 text-orange-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </td>
              <td class="px-4 py-3 text-sm text-green-700 font-mono font-semibold">
                {{ suggestion.cleanedName }}
              </td>
              <td class="px-4 py-3 text-xs">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {{ suggestion.actorName }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 text-center">
                {{ suggestion.year || '-' }}
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 truncate" :title="suggestion.groupTitle">
                {{ suggestion.groupTitle }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredSuggestions.length) }} of {{ filteredSuggestions.length }} results
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span class="text-sm text-gray-700">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isAnalyzing && allSuggestions.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">No Movies Analyzed Yet</h3>
      <p class="mt-2 text-gray-500 max-w-md mx-auto">
        Click "Analyze Movies" to scan your movie collection and find titles with actor names that can be cleaned for better media server matching.
      </p>
      <button
        @click="analyzeMovies"
        class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 font-semibold"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        Analyze Movies
      </button>
    </div>

    <!-- No Results After Filter -->
    <div v-else-if="!isAnalyzing && allSuggestions.length > 0 && filteredSuggestions.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">No Movies Match Selected Categories</h3>
      <p class="mt-2 text-gray-500">
        Try selecting different categories or select "All Categories"
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CleanupTab',
  data() {
    return {
      isAnalyzing: false,
      isApplying: false,
      isAddingPattern: false,
      allSuggestions: [],
      selectedMovies: new Set(),
      selectedCategories: new Set(),
      selectAll: false,
      selectAllCategories: true,
      cleanupStats: {
        totalPatterns: 0,
        totalCleaned: 0,
        lastCleanup: null
      },
      patterns: [],
      showPatternManager: false,
      newPatternValue: '',
      newPatternDescription: '',
      currentPage: 1,
      pageSize: 50
    };
  },
  computed: {
    filteredSuggestions() {
      if (this.selectAllCategories || this.selectedCategories.size === 0) {
        return this.allSuggestions;
      }
      return this.allSuggestions.filter(s => this.selectedCategories.has(s.groupTitle));
    },
    availableCategories() {
      const categoryMap = new Map();
      this.allSuggestions.forEach(s => {
        const count = categoryMap.get(s.groupTitle) || 0;
        categoryMap.set(s.groupTitle, count + 1);
      });
      return Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    totalPages() {
      return Math.ceil(this.filteredSuggestions.length / this.pageSize);
    },
    paginatedSuggestions() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredSuggestions.slice(start, end);
    }
  },
  watch: {
    filteredSuggestions() {
      // Reset to page 1 when filter changes
      this.currentPage = 1;
      // Update select all based on filtered results
      this.updateSelectAll();
    }
  },
  mounted() {
    this.loadStats();
    this.loadPatterns();
  },
  methods: {
    async loadStats() {
      try {
        const response = await fetch('/api/cleanup/stats');
        const data = await response.json();
        if (data.success) {
          this.cleanupStats = data.stats;
        }
      } catch (error) {
        console.error('Error loading cleanup stats:', error);
      }
    },

    async loadPatterns() {
      try {
        const response = await fetch('/api/cleanup/patterns');
        const data = await response.json();
        if (data.success) {
          this.patterns = data.patterns;
        }
      } catch (error) {
        console.error('Error loading patterns:', error);
      }
    },

    async addPattern() {
      if (!this.newPatternValue.trim()) return;

      this.isAddingPattern = true;
      try {
        const response = await fetch('/api/cleanup/patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'actor',
            value: this.newPatternValue.trim(),
            description: this.newPatternDescription.trim()
          })
        });

        const data = await response.json();

        if (data.success) {
          this.$emit('show-toast', {
            message: `Added pattern: ${this.newPatternValue}`,
            type: 'success'
          });
          this.newPatternValue = '';
          this.newPatternDescription = '';
          await this.loadPatterns();
          await this.loadStats();
        } else {
          throw new Error(data.error || 'Failed to add pattern');
        }
      } catch (error) {
        console.error('Error adding pattern:', error);
        this.$emit('show-toast', {
          message: 'Error adding pattern: ' + error.message,
          type: 'error'
        });
      } finally {
        this.isAddingPattern = false;
      }
    },

    async deletePattern(patternId) {
      if (!confirm('Are you sure you want to delete this pattern?')) return;

      try {
        const response = await fetch(`/api/cleanup/patterns/${patternId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          this.$emit('show-toast', {
            message: 'Pattern deleted successfully',
            type: 'success'
          });
          await this.loadPatterns();
          await this.loadStats();
        } else {
          throw new Error(data.error || 'Failed to delete pattern');
        }
      } catch (error) {
        console.error('Error deleting pattern:', error);
        this.$emit('show-toast', {
          message: 'Error deleting pattern: ' + error.message,
          type: 'error'
        });
      }
    },

    async togglePatternStatus(pattern) {
      try {
        const response = await fetch(`/api/cleanup/patterns/${pattern.id}/toggle`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !pattern.enabled })
        });

        const data = await response.json();

        if (data.success) {
          pattern.enabled = !pattern.enabled;
          this.$emit('show-toast', {
            message: `Pattern ${pattern.enabled ? 'enabled' : 'disabled'}`,
            type: 'success'
          });
        } else {
          throw new Error(data.error || 'Failed to toggle pattern');
        }
      } catch (error) {
        console.error('Error toggling pattern:', error);
        this.$emit('show-toast', {
          message: 'Error toggling pattern: ' + error.message,
          type: 'error'
        });
      }
    },

    toggleCategory(categoryName) {
      if (this.selectedCategories.has(categoryName)) {
        this.selectedCategories.delete(categoryName);
      } else {
        this.selectedCategories.add(categoryName);
      }
      this.selectAllCategories = this.selectedCategories.size === this.availableCategories.length;
    },

    toggleAllCategories() {
      if (this.selectAllCategories) {
        this.selectedCategories.clear();
      } else {
        this.selectedCategories.clear();
        this.availableCategories.forEach(cat => this.selectedCategories.add(cat.name));
      }
    },

    async analyzeMovies() {
      this.isAnalyzing = true;
      this.allSuggestions = [];
      this.selectedMovies.clear();
      this.selectedCategories.clear();
      this.selectAll = false;
      this.selectAllCategories = true;
      this.currentPage = 1;

      try {
        const response = await fetch('/api/cleanup/analyze');
        const data = await response.json();

        if (data.success) {
          this.allSuggestions = data.suggestions;
          this.$emit('show-toast', {
            message: `Found ${data.total} movies that can be cleaned`,
            type: 'success'
          });
        } else {
          throw new Error(data.error || 'Failed to analyze movies');
        }
      } catch (error) {
        console.error('Error analyzing movies:', error);
        this.$emit('show-toast', {
          message: 'Error analyzing movies: ' + error.message,
          type: 'error'
        });
      } finally {
        this.isAnalyzing = false;
      }
    },

    toggleSelection(movieId) {
      if (this.selectedMovies.has(movieId)) {
        this.selectedMovies.delete(movieId);
      } else {
        this.selectedMovies.add(movieId);
      }
      this.updateSelectAll();
    },

    toggleSelectAll() {
      if (this.selectAll) {
        this.filteredSuggestions.forEach(s => this.selectedMovies.add(s.id));
      } else {
        this.selectedMovies.clear();
      }
    },

    updateSelectAll() {
      this.selectAll = this.filteredSuggestions.length > 0 &&
        this.filteredSuggestions.every(s => this.selectedMovies.has(s.id));
    },

    async applyCleanup() {
      if (this.selectedMovies.size === 0) {
        this.$emit('show-toast', {
          message: 'Please select at least one movie to clean',
          type: 'warning'
        });
        return;
      }

      if (!confirm(`Are you sure you want to clean ${this.selectedMovies.size} movie names? This will update the movie names in the database.`)) {
        return;
      }

      this.isApplying = true;

      try {
        const movieIds = Array.from(this.selectedMovies);

        const response = await fetch('/api/cleanup/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieIds })
        });

        const data = await response.json();

        if (data.success) {
          let message = `Successfully cleaned ${data.updated} movie names!`;

          // Show errors if any
          if (data.errors && data.errors.length > 0) {
            message += ` (${data.errors.length} failed)`;
            console.warn('Cleanup errors:', data.errors);
          }

          this.$emit('show-toast', {
            message,
            type: data.errors && data.errors.length > 0 ? 'warning' : 'success'
          });

          // Reload analyze to get fresh data
          await this.analyzeMovies();

          this.selectedMovies.clear();
          this.selectAll = false;

          // Reload stats
          await this.loadStats();

          // Notify parent to refresh movie list
          this.$emit('refresh-movies');
        } else {
          throw new Error(data.error || 'Failed to apply cleanup');
        }
      } catch (error) {
        console.error('Error applying cleanup:', error);
        this.$emit('show-toast', {
          message: 'Error applying cleanup: ' + error.message,
          type: 'error'
        });
      } finally {
        this.isApplying = false;
      }
    }
  }
};
</script>
