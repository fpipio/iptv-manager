<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Movies</h1>
        <p class="text-gray-600">Manage your movie collection and STRM files</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 relative">
          <!-- Loading Overlay -->
          <div v-if="loadingStats" class="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
            <svg class="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-medium text-blue-700">Updating...</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Movies</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.total.toLocaleString() }}</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 relative">
          <!-- Loading Overlay -->
          <div v-if="loadingStats" class="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
            <svg class="animate-spin h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-medium text-green-700">Updating...</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">STRM Files</p>
              <p class="text-3xl font-bold text-green-600 mt-2">{{ stats.strm_files_count.toLocaleString() }}</p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 relative">
          <!-- No loading overlay for static config value -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Movies Directory</p>
              <p class="text-sm font-mono text-gray-900 mt-2 truncate" :title="stats.movies_directory">
                {{ stats.movies_directory }}
              </p>
            </div>
            <div class="bg-purple-100 rounded-full p-3">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="activeTab = 'library'"
              :class="[
                activeTab === 'library'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
              </svg>
              Library
            </button>
            <button
              @click="activeTab = 'cleanup'"
              :class="[
                activeTab === 'cleanup'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Cleanup
            </button>
            <button
              @click="activeTab = 'year-libraries'"
              :class="[
                activeTab === 'year-libraries'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Year Organization
            </button>
            <button
              @click="activeTab = 'import'"
              :class="[
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Import
            </button>
          </nav>
        </div>
      </div>

      <!-- Import Tab Content -->
      <div v-if="activeTab === 'import'" class="bg-white rounded-lg shadow p-6">
        <MoviesImportTab />
      </div>

      <!-- Library Tab Content -->
      <div v-if="activeTab === 'library'">
        <!-- Output Directory Config -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-gray-700 whitespace-nowrap">
            STRM Output Directory:
          </label>
          <input
            v-model="outputDirectory"
            type="text"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            placeholder="/app/data/movies"
            @blur="saveOutputDirectory"
          />
          <button
            @click="saveOutputDirectory"
            :disabled="isSavingConfig"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="isSavingConfig" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isSavingConfig ? 'Saving...' : 'Save' }}</span>
          </button>
        </div>
        <p class="mt-2 text-xs text-gray-500">
          Files will be created as: {output_dir}/{movie_name}/{movie_name}.strm
        </p>
      </div>

      <!-- Emby Integration (Conditional) -->
      <div v-if="isEmbyConfigured" class="bg-green-50 border border-green-200 rounded-lg shadow p-4 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <div>
              <h3 class="text-sm font-semibold text-gray-700">Emby Integration</h3>
              <p class="text-xs text-gray-500">
                Refresh all Emby libraries after STRM file changes
                <span class="text-gray-400 ml-1">(Configure in Settings > General > Integrations)</span>
              </p>
            </div>
          </div>
          <button
            @click="refreshEmbyLibrary"
            :disabled="isRefreshingEmby"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            title="Refresh All Emby Libraries"
          >
            <svg v-if="isRefreshingEmby" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ isRefreshingEmby ? 'Refreshing...' : 'Refresh All Libraries' }}
          </button>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <!-- Search -->
          <div class="flex-1 max-w-md">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search movies..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                @input="debouncedSearch"
              />
              <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="rescanFilesystem"
              :disabled="isRescanning"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="isRescanning" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isRescanning ? 'Scanning...' : 'Re-scan Filesystem' }}</span>
            </button>

            <button
              @click="loadData"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Movies Table -->
      <div v-if="loading || isLoadingAll" class="text-center py-12">
        <div v-if="!isLoadingAll" class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

        <!-- Progress Bar -->
        <div v-if="isLoadingAll && totalMovies > 0" class="max-w-xl mx-auto">
          <p class="mb-4 text-lg font-semibold text-gray-700">Loading all movies...</p>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-6 mb-4 overflow-hidden">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
              :style="{ width: loadingProgress + '%' }"
            >
              <span class="text-xs font-bold text-white">{{ loadingProgress }}%</span>
            </div>
          </div>

          <p class="text-sm text-gray-600">
            {{ movies.length.toLocaleString() }} of {{ totalMovies.toLocaleString() }} movies loaded
          </p>
        </div>

        <p v-else-if="!isLoadingAll" class="mt-4 text-gray-600">Loading movies...</p>
      </div>

      <div v-else-if="filteredMovies.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">No movies found</h3>
        <p class="mt-2 text-gray-500">
          {{ searchQuery ? 'Try a different search term' : 'Import an M3U file with movie entries to get started' }}
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- Group by group_title -->
        <div v-for="(groupMovies, groupTitle) in moviesByGroup" :key="groupTitle" class="bg-white rounded-lg shadow overflow-hidden">
          <!-- Group Header -->
          <div
            class="bg-gray-100 px-6 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
            @click="toggleGroup(groupTitle, $event)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <svg
                  class="w-5 h-5 text-gray-600 transition-transform duration-200"
                  :class="{ 'rotate-90': expandedGroups.has(groupTitle) }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <input
                  type="checkbox"
                  :checked="isGroupEnabled(groupTitle)"
                  @change="toggleGroupStrm(groupTitle, $event.target.checked)"
                  @click.stop
                  class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  :disabled="!outputDirectory || activeJobs.has(groupTitle)"
                  :title="getCheckboxTitle(groupTitle)"
                />
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  📁 {{ groupTitle }}
                </h3>
              </div>
              <span class="text-sm text-gray-500">
                {{ groupMovies.length }} {{ groupMovies.length === 1 ? 'movie' : 'movies' }}
              </span>
            </div>

            <!-- Progress Bar for Active Job -->
            <div v-if="activeJobs.has(groupTitle)" class="mt-3" @click.stop>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-gray-700">
                  {{ activeJobs.get(groupTitle).type === 'create' ? 'Creating' : 'Deleting' }} STRM files...
                </span>
                <span class="text-xs font-semibold text-gray-700">
                  {{ activeJobs.get(groupTitle).progress }}%
                </span>
              </div>
              <div class="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: activeJobs.get(groupTitle).progress + '%' }"
                ></div>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-gray-600">
                  {{ activeJobs.get(groupTitle).processed }} / {{ activeJobs.get(groupTitle).total }}
                </span>
                <button
                  @click="cancelJob(groupTitle)"
                  class="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Group Content (collapsible) -->
          <div v-if="expandedGroups.has(groupTitle)" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Movie Title
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folder
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="movie in groupMovies"
                  :key="movie.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ movie.tvg_name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{ getFileName(movie.folder_path) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="viewUrl(movie)"
                      class="text-blue-600 hover:text-blue-900 mr-4"
                      title="View stream URL"
                    >
                      View URL
                    </button>
                    <button
                      @click="deleteMovie(movie)"
                      class="text-red-600 hover:text-red-900"
                      title="Delete movie"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
      </div>
      <!-- End Movies Tab Content -->

      <!-- Cleanup Tab Content -->
      <CleanupTab
        v-if="activeTab === 'cleanup'"
        @show-toast="showToast"
        @refresh-movies="loadData"
      />
      <!-- End Cleanup Tab Content -->

      <!-- Year Libraries Tab Content -->
      <YearLibrariesTab
        v-if="activeTab === 'year-libraries'"
        @toast="showToast"
      />
      <!-- End Year Libraries Tab Content -->
    </div>

    <!-- URL Modal -->
    <div
      v-if="showUrlModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="showUrlModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Stream URL</h3>
          <button @click="showUrlModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">{{ selectedMovie?.tvg_name }}</p>
          <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm break-all">
            {{ selectedMovie?.url }}
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="copyUrl"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Copy to Clipboard
          </button>
          <button
            @click="showUrlModal = false"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from '../composables/useToast';
import MoviesImportTab from '../components/movies/MoviesImportTab.vue';
import CleanupTab from '../components/movies/CleanupTab.vue';
import YearLibrariesTab from '../components/movies/YearLibrariesTab.vue';

export default {
  name: 'MoviesView',
  components: {
    MoviesImportTab,
    CleanupTab,
    YearLibrariesTab
  },
  setup() {
    const { showToast } = useToast();
    return { showToast };
  },
  data() {
    return {
      activeTab: 'library', // 'library', 'cleanup', 'year-libraries', 'import'
      movies: [],
      stats: {
        total: 0,
        strm_files_count: 0,
        movies_directory: ''
      },
      loading: false,
      isRescanning: false,
      isSavingConfig: false,
      isRefreshingEmby: false,
      searchQuery: '',
      filteredMovies: [],
      showUrlModal: false,
      selectedMovie: null,
      searchTimeout: null,
      currentPage: 1,
      itemsPerPage: 100,
      outputDirectory: '',  // Will be loaded from server
      embyConfig: {
        serverUrl: '',
        apiToken: '',
        enabled: false
      },
      totalMovies: 0,
      expandedGroups: new Set(), // Track which groups are expanded
      loadingProgress: 0, // Progress percentage (0-100)
      isLoadingAll: false, // Track if loading all movies
      loadingStats: false, // Track if stats are loading
      activeJobs: new Map(), // Track active jobs per group: groupTitle -> { jobId, progress, status }
      pollIntervals: new Map() // Track polling intervals per jobId
    };
  },
  computed: {
    moviesByGroup() {
      // Group movies by group_title
      const grouped = {};
      this.filteredMovies.forEach(movie => {
        const groupTitle = movie.group_title || 'Uncategorized';
        if (!grouped[groupTitle]) {
          grouped[groupTitle] = [];
        }
        grouped[groupTitle].push(movie);
      });

      // Sort groups alphabetically
      const sortedGrouped = {};
      Object.keys(grouped).sort().forEach(key => {
        sortedGrouped[key] = grouped[key];
      });

      return sortedGrouped;
    },

    isEmbyConfigured() {
      return this.embyConfig.enabled &&
             this.embyConfig.serverUrl &&
             this.embyConfig.apiToken;
    }
  },
  async mounted() {
    // Load config FIRST (before movies data)
    await this.loadConfig();
    // Then load movies
    this.loadData();

    // Listen for Emby config updates from Settings
    window.addEventListener('emby-config-updated', this.handleEmbyConfigUpdate);
  },
  beforeUnmount() {
    // Clear all polling intervals
    for (const interval of this.pollIntervals.values()) {
      clearInterval(interval);
    }
    // Remove event listener
    window.removeEventListener('emby-config-updated', this.handleEmbyConfigUpdate);
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.isLoadingAll = true;
      this.loadingProgress = 0;

      try {
        // Start loading movies immediately in parallel with stats
        const batchSize = 1000;
        let offset = 0;
        let allMovies = [];

        // Get first batch to know total count (fast!)
        const firstBatch = await axios.get(`/api/movies?limit=${batchSize}&offset=0`);
        const totalMovies = firstBatch.data.total || 0;
        this.totalMovies = totalMovies;

        if (totalMovies === 0) {
          this.loading = false;
          this.isLoadingAll = false;
          return;
        }

        // Add first batch
        allMovies = firstBatch.data.data || [];
        offset = batchSize;
        this.loadingProgress = Math.min(Math.round((offset / totalMovies) * 100), 100);
        this.movies = allMovies;
        this.applyFilters();

        // Load remaining batches (no delay!)
        while (offset < totalMovies) {
          const response = await axios.get(`/api/movies?limit=${batchSize}&offset=${offset}`);
          const batch = response.data.data || [];

          allMovies = [...allMovies, ...batch];
          offset += batchSize;

          // Update progress
          this.loadingProgress = Math.min(Math.round((offset / totalMovies) * 100), 100);
          this.movies = allMovies;
          this.applyFilters();
        }

        this.movies = allMovies;
        this.loadingProgress = 100;
        this.applyFilters();

        // Load stats in background (non-blocking)
        this.loadStats();
      } catch (error) {
        console.error('Error loading movies:', error);
        this.showToast('Failed to load movies', 'error');
      } finally {
        this.loading = false;
        this.isLoadingAll = false;
      }
    },

    async loadConfig() {
      // Load configuration FIRST (called from mounted)
      console.log('[MoviesView] Loading configuration from server...');

      try {
        // Load movies directory configuration
        const configRes = await axios.get('/api/movies/config');
        console.log('[MoviesView] GET /api/movies/config response:', configRes.data);

        if (configRes.data.success && configRes.data.data && configRes.data.data.movies_directory) {
          this.outputDirectory = configRes.data.data.movies_directory;
          console.log('[MoviesView] ✓ Loaded movies_directory:', this.outputDirectory);
        } else {
          console.warn('[MoviesView] ⚠ movies_directory not found in response, using default');
          this.outputDirectory = '/app/data/movies';  // Fallback default
        }
      } catch (error) {
        console.error('[MoviesView] ✗ Error loading movies config:', error);
        this.outputDirectory = '/app/data/movies';  // Fallback default
      }

      try {
        // Load Emby configuration
        const embyRes = await axios.get('/api/movies/emby-config');
        if (embyRes.data.data) {
          this.embyConfig = {
            serverUrl: embyRes.data.data.emby_server_url || '',
            apiToken: embyRes.data.data.emby_api_token || '',
            enabled: embyRes.data.data.emby_enabled === true
          };
          console.log('[MoviesView] ✓ Loaded Emby config, enabled:', this.embyConfig.enabled);
        }
      } catch (error) {
        console.error('[MoviesView] ⚠ Error loading Emby config:', error);
        // Not critical, just log
      }
    },

    async loadStats() {
      this.loadingStats = true;
      try {
        // Load stats only (config already loaded in mounted)
        const statsRes = await axios.get('/api/movies/stats');
        this.stats = statsRes.data.data || {
          total: 0,
          strm_files_count: 0,
          movies_directory: ''
        };
      } catch (error) {
        console.error('[MoviesView] Error loading stats:', error);
      } finally {
        this.loadingStats = false;
      }
    },

    async loadMore() {
      try {
        const response = await axios.get(`/api/movies?limit=100&offset=${this.movies.length}`);
        const newMovies = response.data.data || [];

        // Append new movies to existing list
        this.movies = [...this.movies, ...newMovies];
        this.applyFilters();
      } catch (error) {
        console.error('Error loading more movies:', error);
        this.showToast('Failed to load more movies', 'error');
      }
    },

    applyFilters() {
      if (!this.searchQuery) {
        this.filteredMovies = this.movies;
      } else {
        const query = this.searchQuery.toLowerCase();
        this.filteredMovies = this.movies.filter(movie =>
          movie.tvg_name.toLowerCase().includes(query)
        );
      }
      // Reset to first page when filters change
      this.currentPage = 1;
    },

    debouncedSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.applyFilters();
      }, 300);
    },

    async rescanFilesystem() {
      this.isRescanning = true;
      try {
        const response = await axios.post('/api/movies/rescan');
        const results = response.data.data;

        this.showToast(
          `Scan completed: ${results.checked} checked, ${results.missing} missing, ${results.recreated} recreated`,
          'success'
        );

        // Only reload stats to show updated STRM count (shows loading overlay)
        await this.loadStats();
      } catch (error) {
        console.error('Error rescanning filesystem:', error);
        this.showToast('Failed to rescan filesystem', 'error');
      } finally {
        this.isRescanning = false;
      }
    },

    toggleGroup(groupTitle, event) {
      // Don't toggle if clicking on checkbox
      if (event.target.type === 'checkbox') return;

      if (this.expandedGroups.has(groupTitle)) {
        this.expandedGroups.delete(groupTitle);
      } else {
        this.expandedGroups.add(groupTitle);
      }
      // Force re-render
      this.expandedGroups = new Set(this.expandedGroups);
    },

    updateGroupStrmState(groupTitle, enabled) {
      // Update strm_enabled state for all movies in the group without full reload
      this.movies.forEach(movie => {
        if (movie.group_title === groupTitle) {
          movie.strm_enabled = enabled ? 1 : 0;
        }
      });
      // Force reactivity update
      this.applyFilters();
    },

    getCheckboxTitle(groupTitle) {
      if (this.activeJobs.has(groupTitle)) {
        return 'Job in progress...';
      }
      if (!this.outputDirectory) {
        return 'Set output directory first';
      }
      return 'Toggle STRM generation for this group';
    },

    isGroupEnabled(groupTitle) {
      // Check if all movies in this group have strm_enabled = 1
      const groupMovies = this.moviesByGroup[groupTitle] || [];
      if (groupMovies.length === 0) return false;

      // At least one movie must have strm_enabled = 1
      return groupMovies.some(movie => movie.strm_enabled === 1);
    },

    async toggleGroupStrm(groupTitle, enabled) {
      if (!this.outputDirectory) {
        this.showToast('Please set output directory first', 'error');
        return;
      }

      try {
        // Start job
        const response = await axios.post('/api/movies/toggle-strm-group', {
          groupTitle,
          enabled,
          outputDir: this.outputDirectory
        });

        const { jobId, total } = response.data;

        // Track job
        this.activeJobs.set(groupTitle, {
          jobId,
          type: enabled ? 'create' : 'delete',
          progress: 0,
          processed: 0,
          total,
          status: 'running'
        });

        // Force reactivity
        this.activeJobs = new Map(this.activeJobs);

        // Start polling
        this.pollJobProgress(groupTitle, jobId);
      } catch (error) {
        console.error('Error starting STRM job:', error);
        this.showToast(
          error.response?.data?.message || 'Failed to start job',
          'error'
        );
      }
    },

    async pollJobProgress(groupTitle, jobId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/movies/jobs/${jobId}`);
          const job = response.data.job;

          // Update job status
          const activeJob = this.activeJobs.get(groupTitle);
          if (activeJob) {
            activeJob.progress = job.progress;
            activeJob.processed = job.processed;
            activeJob.status = job.status;
            this.activeJobs = new Map(this.activeJobs);
          }

          // Check if job is completed, failed, or cancelled
          if (job.status === 'completed') {
            clearInterval(pollInterval);
            this.pollIntervals.delete(jobId);
            this.activeJobs.delete(groupTitle);
            this.activeJobs = new Map(this.activeJobs);

            // Show success message
            const message = job.type === 'create'
              ? `Created ${job.created} STRM files`
              : `Deleted ${job.deleted} STRM files`;

            this.showToast(`${message} for "${groupTitle}"`, 'success');

            // Update only the affected movies in-memory (no full reload)
            this.updateGroupStrmState(groupTitle, job.type === 'create');

            // Reload stats in background to update counters
            this.loadStats();
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            this.pollIntervals.delete(jobId);
            this.activeJobs.delete(groupTitle);
            this.activeJobs = new Map(this.activeJobs);

            this.showToast(`Job failed: ${job.error}`, 'error');
          } else if (job.status === 'cancelled') {
            clearInterval(pollInterval);
            this.pollIntervals.delete(jobId);
            this.activeJobs.delete(groupTitle);
            this.activeJobs = new Map(this.activeJobs);

            this.showToast('Job cancelled', 'info');
          }
        } catch (error) {
          console.error('Error polling job progress:', error);
          clearInterval(pollInterval);
          this.pollIntervals.delete(jobId);
          this.activeJobs.delete(groupTitle);
          this.activeJobs = new Map(this.activeJobs);
        }
      }, 1000); // Poll every second

      this.pollIntervals.set(jobId, pollInterval);
    },

    async cancelJob(groupTitle) {
      const activeJob = this.activeJobs.get(groupTitle);
      if (!activeJob) return;

      try {
        await axios.delete(`/api/movies/jobs/${activeJob.jobId}`);
        this.showToast('Cancelling job...', 'info');
      } catch (error) {
        console.error('Error cancelling job:', error);
        this.showToast('Failed to cancel job', 'error');
      }
    },

    async saveOutputDirectory() {
      if (!this.outputDirectory || !this.outputDirectory.trim()) {
        this.showToast('Output directory cannot be empty', 'error');
        return;
      }

      this.isSavingConfig = true;
      try {
        console.log('[MoviesView] Saving movies_directory:', this.outputDirectory);

        const response = await axios.put('/api/movies/config', {
          movies_directory: this.outputDirectory
        });

        console.log('[MoviesView] PUT /api/movies/config response:', response.data);

        if (response.data.success) {
          this.showToast('Output directory saved successfully', 'success');

          // Update stats card to show new value
          this.stats.movies_directory = this.outputDirectory;

          // Reload stats (counts only)
          await this.loadStats();
        } else {
          throw new Error(response.data.message || 'Save failed');
        }
      } catch (error) {
        console.error('[MoviesView] Error saving config:', error);
        this.showToast(
          error.response?.data?.message || 'Failed to save output directory',
          'error'
        );
      } finally {
        this.isSavingConfig = false;
      }
    },

    handleEmbyConfigUpdate() {
      // Reload Emby config when updated from Settings
      this.loadConfig();
    },

    async refreshEmbyLibrary() {
      if (!this.isEmbyConfigured) {
        this.showToast('Please configure Emby first', 'error');
        return;
      }

      this.isRefreshingEmby = true;
      try {
        const response = await axios.post('/api/movies/emby-refresh');
        this.showToast(
          response.data.message || 'Emby library refresh triggered successfully',
          'success'
        );
      } catch (error) {
        console.error('Error refreshing Emby library:', error);
        this.showToast(
          error.response?.data?.message || 'Failed to refresh Emby library',
          'error'
        );
      } finally {
        this.isRefreshingEmby = false;
      }
    },

    viewUrl(movie) {
      this.selectedMovie = movie;
      this.showUrlModal = true;
    },

    async copyUrl() {
      try {
        await navigator.clipboard.writeText(this.selectedMovie.url);
        this.showToast('URL copied to clipboard', 'success');
      } catch (error) {
        console.error('Failed to copy:', error);
        this.showToast('Failed to copy URL', 'error');
      }
    },

    async deleteMovie(movie) {
      if (!confirm(`Delete "${movie.tvg_name}"?\n\nThis will remove the movie from database and delete the STRM file.`)) {
        return;
      }

      try {
        await axios.delete(`/api/movies/${movie.id}`);
        this.showToast('Movie deleted successfully', 'success');

        // Remove movie from local array (no full reload)
        const index = this.movies.findIndex(m => m.id === movie.id);
        if (index !== -1) {
          this.movies.splice(index, 1);
        }

        // Update filtered view
        this.applyFilters();

        // Reload stats to update counters (shows loading overlay)
        await this.loadStats();
      } catch (error) {
        console.error('Error deleting movie:', error);
        this.showToast('Failed to delete movie', 'error');
      }
    },

    handleImageError(event) {
      event.target.style.display = 'none';
    },

    getFileName(fullPath) {
      if (!fullPath) return '';
      const parts = fullPath.split(/[/\\]/);
      return parts[parts.length - 1] || fullPath;
    }
  }
};
</script>
