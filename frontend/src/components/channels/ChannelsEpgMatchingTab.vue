<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <!-- Confirm Dialogs -->
    <ConfirmDialog
      v-for="d in confirm.dialogs.value"
      :key="d.id"
      :title="d.title"
      :message="d.message"
      :confirmText="d.confirmText"
      :cancelText="d.cancelText"
      :type="d.type"
      @confirm="d.onConfirm"
      @cancel="d.onCancel"
    />

    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">EPG Channel Matching</h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Map your M3U channels to EPG sources for automatic TV guide data
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div class="bg-white rounded-lg shadow p-3 sm:p-4">
          <div class="text-xs sm:text-sm text-gray-500">Total Channels</div>
          <div class="text-xl sm:text-2xl font-bold text-gray-900">{{ stats.totalChannels || 0 }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-3 sm:p-4">
          <div class="text-xs sm:text-sm text-gray-500">Mapped</div>
          <div class="text-xl sm:text-2xl font-bold text-green-600">{{ stats.mappedChannels || 0 }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-3 sm:p-4">
          <div class="text-xs sm:text-sm text-gray-500">Unmapped</div>
          <div class="text-xl sm:text-2xl font-bold text-orange-600">{{ stats.unmappedChannels || 0 }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-3 sm:p-4">
          <div class="text-xs sm:text-sm text-gray-500 truncate">Manual Overrides</div>
          <div class="text-xl sm:text-2xl font-bold text-blue-600">{{ stats.manualMatches || 0 }}</div>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
        <!-- Search Bar -->
        <div class="mb-3 sm:mb-4">
          <div class="relative max-w-md">
            <input
              v-model="channelSearchQuery"
              type="text"
              placeholder="Search channels by name, tvg-id, EPG source..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            @click="syncEpgChannels"
            :disabled="isAnyOperationRunning"
            class="px-3 py-2 sm:px-4 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="syncing" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing EPG Sources...
            </span>
            <span v-else>Sync EPG Sources</span>
          </button>
          <button
            @click="runAutoMatching"
            :disabled="isAnyOperationRunning || stats.totalChannels === 0"
            class="px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="matching" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="hidden sm:inline">Running Auto-Matching...</span>
              <span class="sm:hidden">Matching...</span>
            </span>
            <template v-else>
              <span class="hidden sm:inline">Run Auto-Matching</span>
              <span class="sm:hidden">Auto-Match</span>
            </template>
          </button>
          <button
            @click="grabCustomEpg"
            :disabled="isAnyOperationRunning || stats.mappedChannels === 0"
            class="px-3 py-2 sm:px-4 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="grabbing" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="hidden sm:inline">Grabbing EPG Data...</span>
              <span class="sm:hidden">Grabbing...</span>
            </span>
            <template v-else>
              <span class="hidden sm:inline">Grab EPG Data</span>
              <span class="sm:hidden">Grab EPG</span>
            </template>
          </button>
          <label class="ml-auto flex items-center cursor-pointer">
            <input
              v-model="showOnlyUnmapped"
              type="checkbox"
              class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span class="ml-2 text-xs sm:text-sm text-gray-700"><span class="hidden sm:inline">Show only unmapped</span><span class="sm:hidden">Unmapped</span></span>
          </label>
        </div>
      </div>

      <!-- EPG Channels Stats (if available) -->
      <div v-if="epgChannelsStats" class="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 class="text-xl font-semibold mb-4">Available EPG Channels</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="border-l-4 border-indigo-500 pl-4">
            <div class="text-sm text-gray-500">Total EPG Channels</div>
            <div class="text-2xl font-bold text-gray-900">{{ epgChannelsStats.totalChannels || 0 }}</div>
          </div>
          <div class="border-l-4 border-purple-500 pl-4">
            <div class="text-sm text-gray-500">Active Sources</div>
            <div class="text-2xl font-bold text-gray-900">{{ epgChannelsStats.sourcesCount || 0 }}</div>
          </div>
          <div class="col-span-1 md:col-span-1">
            <div class="text-sm text-gray-500 mb-2">Channels by Source</div>
            <div class="space-y-1">
              <div
                v-for="source in epgChannelsStats.channelsBySite?.slice(0, 3)"
                :key="source.site"
                class="text-xs text-gray-600"
              >
                <span class="font-medium">{{ source.site_name }}:</span> {{ source.count }} channels
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mappings List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 class="text-lg sm:text-xl font-semibold">Channel Mappings</h2>
        </div>

        <!-- Desktop Table View (hidden on mobile) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">M3U Channel</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVG-ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EPG Source</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EPG Channel</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="mapping in filteredMappings"
                :key="mapping.channel_id"
                :class="mapping.epg_xmltv_id ? 'bg-white' : 'bg-orange-50'"
              >
                <!-- M3U Channel Name -->
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900">
                    {{ mapping.custom_tvg_name || mapping.imported_tvg_name || 'Unknown' }}
                  </div>
                </td>

                <!-- TVG-ID -->
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ mapping.imported_tvg_id || '-' }}
                </td>

                <!-- EPG Source -->
                <td class="px-6 py-4 text-sm">
                  <span
                    v-if="mapping.source_name"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {{ mapping.source_name }}
                  </span>
                  <span v-else class="text-gray-400">No mapping</span>
                </td>

                <!-- EPG Channel -->
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div v-if="mapping.epg_display_name">
                    <div class="font-medium">{{ mapping.epg_display_name }}</div>
                    <div class="text-xs text-gray-400">{{ mapping.epg_site_id }}</div>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Match Quality -->
                <td class="px-6 py-4 text-sm">
                  <span
                    v-if="mapping.match_quality"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getMatchQualityClass(mapping.match_quality, mapping.is_manual)"
                  >
                    {{ mapping.is_manual ? 'Manual' : mapping.match_quality }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-sm">
                  <div class="flex items-center space-x-2">
                    <button
                      v-if="mapping.epg_xmltv_id"
                      @click="viewAlternatives(mapping)"
                      class="text-indigo-600 hover:text-indigo-900"
                      title="View alternative sources"
                    >
                      Change
                    </button>
                    <button
                      v-if="mapping.epg_xmltv_id"
                      @click="deleteMapping(mapping.channel_id)"
                      class="text-red-600 hover:text-red-900 ml-2"
                      title="Remove mapping"
                    >
                      Remove
                    </button>
                    <button
                      v-else
                      @click="manualMapChannel(mapping)"
                      class="text-green-600 hover:text-green-900"
                      title="Map manually"
                    >
                      Map Manually
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View (hidden on desktop) -->
        <div class="md:hidden divide-y divide-gray-200">
          <div v-for="mapping in filteredMappings" :key="mapping.channel_id"
               :class="['p-3', mapping.epg_xmltv_id ? 'bg-white' : 'bg-orange-50']">

            <!-- Header: Channel Name + TVG-ID -->
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 text-sm truncate">
                  {{ mapping.custom_tvg_name || mapping.imported_tvg_name || 'Unknown' }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ mapping.imported_tvg_id || 'No ID' }}
                </div>
              </div>
              <!-- Match Badge -->
              <span v-if="mapping.match_quality"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0"
                    :class="getMatchQualityClass(mapping.match_quality, mapping.is_manual)">
                {{ mapping.is_manual ? '👤' : '✓' }}
              </span>
            </div>

            <!-- EPG Info (only if mapped) -->
            <div v-if="mapping.epg_display_name" class="mb-2 text-xs">
              <div class="flex items-center gap-1.5">
                <span class="font-medium text-gray-700">{{ mapping.epg_display_name }}</span>
                <span class="text-gray-400">•</span>
                <span v-if="mapping.source_name" class="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                  {{ mapping.source_name }}
                </span>
              </div>
            </div>

            <!-- No mapping message -->
            <div v-else class="mb-2 text-xs text-orange-600 font-medium">
              ⚠️ Not mapped to EPG
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-2">
              <button v-if="mapping.epg_xmltv_id"
                      @click="viewAlternatives(mapping)"
                      class="flex-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:bg-indigo-800 transition-colors">
                Change
              </button>
              <button v-if="mapping.epg_xmltv_id"
                      @click="deleteMapping(mapping.channel_id)"
                      class="flex-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors">
                Remove
              </button>
              <button v-else
                      @click="manualMapChannel(mapping)"
                      class="w-full px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors">
                Map to EPG
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="mappings.length === 0 && !loading" class="text-center py-12">
          <p class="text-sm sm:text-base text-gray-500">No channels found. Import an M3U playlist first.</p>
        </div>
      </div>

      <!-- Manual Map Modal (Search EPG) -->
      <div
        v-if="showManualMapModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeManualMapModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-full sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 class="text-lg sm:text-xl font-semibold">Manual EPG Mapping</h3>
            <p class="text-xs sm:text-sm text-gray-600 mt-1">
              Channel: <strong>{{ selectedChannel?.custom_tvg_name || selectedChannel?.imported_tvg_name }}</strong>
              ({{ selectedChannel?.imported_tvg_id || 'no tvg-id' }})
            </p>
          </div>

          <div class="p-4 sm:p-6">
            <!-- Search Bar -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Search EPG Channels</label>
              <input
                v-model="epgSearchQuery"
                @input="searchEpgChannels"
                type="text"
                placeholder="Type channel name or xmltv_id..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p class="text-xs text-gray-500 mt-1">Search across all enabled EPG sources</p>
            </div>

            <!-- Search Results -->
            <div v-if="epgSearchResults.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="result in epgSearchResults"
                :key="result.id"
                class="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 cursor-pointer"
                @click="selectManualMapping(result)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900">{{ result.display_name }}</div>
                    <div class="text-sm text-gray-500 mt-1">
                      Source: <span class="font-medium">{{ result.source_name }}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      XMLTV ID: {{ result.xmltv_id }} | Site ID: {{ result.site_id }}
                    </div>
                  </div>
                  <div class="text-indigo-600">
                    Select →
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="epgSearchQuery" class="text-center text-gray-500 py-8">
              No EPG channels found matching "{{ epgSearchQuery }}"
            </div>
            <div v-else class="text-center text-gray-500 py-8">
              Start typing to search EPG channels
            </div>
          </div>

          <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end">
            <button
              @click="closeManualMapModal"
              class="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Alternatives Modal -->
      <div
        v-if="showAlternativesModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeAlternativesModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-full sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 class="text-lg sm:text-xl font-semibold">Change EPG Source</h3>
            <p class="text-xs sm:text-sm text-gray-600 mt-1">
              Channel: <strong>{{ selectedChannel?.custom_tvg_name || selectedChannel?.imported_tvg_name }}</strong>
              ({{ selectedChannel?.imported_tvg_id }})
            </p>
          </div>

          <div class="p-4 sm:p-6">
            <!-- Search Bar -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Search EPG Channels</label>
              <input
                v-model="alternativesSearchQuery"
                @input="searchAlternatives"
                type="text"
                placeholder="Type channel name or xmltv_id..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p class="text-xs text-gray-500 mt-1">Search across all enabled EPG sources</p>
            </div>

            <!-- Results -->
            <div v-if="filteredAlternatives.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="alt in filteredAlternatives"
                :key="alt.id"
                class="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 cursor-pointer"
                @click="selectAlternative(alt)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900">{{ alt.display_name }}</div>
                    <div class="text-sm text-gray-500 mt-1">
                      Source: <span class="font-medium">{{ alt.source_name }}</span>
                      <span class="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded">P{{ alt.source_priority }}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      Site ID: {{ alt.site_id }} | XMLTV ID: {{ alt.xmltv_id }}
                    </div>
                  </div>
                  <div class="text-indigo-600">
                    Select →
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 py-8">
              {{ alternativesSearchQuery ? 'No channels found matching your search' : 'No alternative sources found for this channel' }}
            </div>
          </div>

          <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-between gap-2">
            <button
              v-if="selectedChannel?.is_manual"
              @click="removeManualMapping"
              class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <span class="hidden sm:inline">Remove Manual Mapping</span>
              <span class="sm:hidden">Remove</span>
            </button>
            <div v-else></div>
            <button
              @click="closeAlternativesModal"
              class="px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
import axios from 'axios';
import { useToast } from '../../composables/useToast';
import { useConfirm } from '../../composables/useConfirm';
import ConfirmDialog from '../shared/ConfirmDialog.vue';

export default {
  name: 'EpgMatchingView',
  components: {
    ConfirmDialog
  },
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    return { toast, confirm };
  },
  data() {
    return {
      loading: false,
      syncing: false,
      matching: false,
      grabbing: false,
      stats: {},
      epgChannelsStats: null,
      mappings: [],
      channelSearchQuery: '',
      showOnlyUnmapped: false,
      showAlternativesModal: false,
      showManualMapModal: false,
      selectedChannel: null,
      alternatives: [],
      alternativesSearchQuery: '',
      allAlternativesForSearch: [],
      epgSearchQuery: '',
      epgSearchResults: [],
      syncTimeout: null,
      matchTimeout: null,
      grabTimeout: null
    };
  },
  computed: {
    filteredMappings() {
      let filtered = this.mappings;

      // Filter by unmapped status
      if (this.showOnlyUnmapped) {
        filtered = filtered.filter(m => !m.epg_xmltv_id);
      }

      // Filter by search query
      if (this.channelSearchQuery && this.channelSearchQuery.trim()) {
        const query = this.channelSearchQuery.toLowerCase().trim();
        filtered = filtered.filter(m => {
          const channelName = (m.custom_tvg_name || m.imported_tvg_name || '').toLowerCase();
          const tvgId = (m.imported_tvg_id || '').toLowerCase();
          const epgName = (m.epg_display_name || '').toLowerCase();
          const sourceName = (m.source_name || '').toLowerCase();

          return channelName.includes(query) ||
                 tvgId.includes(query) ||
                 epgName.includes(query) ||
                 sourceName.includes(query);
        });
      }

      return filtered;
    },
    filteredAlternatives() {
      if (!this.alternativesSearchQuery) {
        return this.alternatives;
      }
      const query = this.alternativesSearchQuery.toLowerCase();
      return this.allAlternativesForSearch
        .filter(ch =>
          ch.display_name?.toLowerCase().includes(query) ||
          ch.xmltv_id?.toLowerCase().includes(query) ||
          ch.site_id?.toLowerCase().includes(query)
        )
        .sort((a, b) => a.source_priority - b.source_priority)
        .slice(0, 20);
    },
    isAnyOperationRunning() {
      return this.syncing || this.matching || this.grabbing;
    }
  },
  mounted() {
    this.loadData();
  },
  // Reload data when component is re-activated from keep-alive cache
  // This ensures fresh data after navigating from other pages
  activated() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        await Promise.all([
          this.loadStats(),
          this.loadMappings(),
          this.loadEpgChannelsStats()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        this.loading = false;
      }
    },
    async loadStats() {
      try {
        const res = await axios.get('/api/epg/matching/stats');
        this.stats = res.data;
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    },
    async loadMappings() {
      try {
        const res = await axios.get('/api/epg/matching/all');
        this.mappings = res.data;
      } catch (error) {
        console.error('Error loading mappings:', error);
        this.mappings = [];
      }
    },
    async loadEpgChannelsStats() {
      try {
        const res = await axios.get('/api/epg/channels/stats');
        this.epgChannelsStats = res.data;
      } catch (error) {
        console.error('Error loading EPG channels stats:', error);
      }
    },
    async syncEpgChannels() {
      const confirmed = await this.confirm.showConfirm({
        title: 'Sync EPG Sources',
        message: 'Sync EPG source channels from filesystem? This will reload all .channels.xml files.',
        confirmText: 'Sync',
        cancelText: 'Cancel',
        type: 'info'
      });

      if (!confirmed) return;

      this.syncing = true;

      // Safety timeout: force reset after 5 minutes
      this.syncTimeout = setTimeout(() => {
        if (this.syncing) {
          this.syncing = false;
          this.toast.error('Sync operation timed out. Please try again or check the server logs.', 5000);
        }
      }, 300000); // 5 minutes

      try {
        const res = await axios.post('/api/epg/channels/sync');
        this.toast.success(`Synced successfully! Sources: ${res.data.totalSources}, Channels: ${res.data.totalChannels}`, 4000);
        await this.loadEpgChannelsStats();
      } catch (error) {
        console.error('Error syncing EPG channels:', error);
        this.toast.error('Failed to sync EPG channels: ' + (error.response?.data?.error || error.message), 5000);
      } finally {
        clearTimeout(this.syncTimeout);
        this.syncing = false;
      }
    },
    async runAutoMatching() {
      const confirmed = await this.confirm.showConfirm({
        title: 'Run Auto-Matching',
        message: 'Run auto-matching for all channels? This will create automatic mappings based on tvg-id.',
        confirmText: 'Run Matching',
        cancelText: 'Cancel',
        type: 'info'
      });

      if (!confirmed) return;

      this.matching = true;

      // Safety timeout: force reset after 5 minutes
      this.matchTimeout = setTimeout(() => {
        if (this.matching) {
          this.matching = false;
          this.toast.error('Auto-matching operation timed out. Please try again or check the server logs.', 5000);
        }
      }, 300000); // 5 minutes

      try {
        const res = await axios.post('/api/epg/matching/auto', {
          useFuzzyMatching: false,
          overwriteManual: false
        });

        this.toast.success(`Auto-matching completed! Matched: ${res.data.matched}, Exact: ${res.data.exact}, Unmapped: ${res.data.unmatched}, Skipped: ${res.data.skipped}`, 5000);

        await this.loadData();
      } catch (error) {
        console.error('Error running auto-matching:', error);
        this.toast.error('Failed to run auto-matching: ' + (error.response?.data?.error || error.message), 5000);
      } finally {
        clearTimeout(this.matchTimeout);
        this.matching = false;
      }
    },
    async grabCustomEpg() {
      const confirmed = await this.confirm.showConfirm({
        title: 'Grab EPG Data',
        message: 'Start EPG grab for mapped channels? This may take several minutes.',
        confirmText: 'Start Grab',
        cancelText: 'Cancel',
        type: 'warning'
      });

      if (!confirmed) return;

      this.grabbing = true;

      // Safety timeout: force reset after 10 minutes (grab can take a while)
      this.grabTimeout = setTimeout(() => {
        if (this.grabbing) {
          this.grabbing = false;
          this.toast.error('EPG grab operation timed out. Please check the server logs to see if it completed.', 5000);
        }
      }, 600000); // 10 minutes

      try {
        const res = await axios.post('/api/epg/grab-custom', {
          days: 1,
          maxConnections: 1,
          timeout: 60000
        });

        this.toast.success(`EPG grab completed! Channels: ${res.data.channelsGrabbed}, Programs: ${res.data.programsGrabbed}, Sources: ${res.data.sources.join(', ')}`, 5000);
      } catch (error) {
        console.error('Error grabbing EPG:', error);
        this.toast.error('Failed to grab EPG: ' + (error.response?.data?.error || error.message), 5000);
      } finally {
        clearTimeout(this.grabTimeout);
        this.grabbing = false;
      }
    },
    async viewAlternatives(mapping) {
      this.selectedChannel = mapping;
      this.showAlternativesModal = true;
      this.alternativesSearchQuery = '';

      try {
        // Load alternatives based on tvg_id
        const res = await axios.get(`/api/epg/matching/alternatives/${mapping.imported_tvg_id}`);
        this.alternatives = res.data;

        // Load all EPG channels for search functionality
        const sourcesRes = await axios.get('/api/epg/sources');
        const enabledSources = sourcesRes.data.filter(s => s.enabled);

        this.allAlternativesForSearch = [];
        for (const source of enabledSources) {
          try {
            const channelsRes = await axios.get(`/api/epg/channels/source/${source.id}`);
            this.allAlternativesForSearch.push(...channelsRes.data.map(ch => ({
              ...ch,
              source_name: source.site_name,
              source_priority: source.priority || 999
            })));
          } catch (error) {
            console.warn(`Error loading channels from ${source.site_name}:`, error);
          }
        }
      } catch (error) {
        console.error('Error loading alternatives:', error);
        this.alternatives = [];
        this.allAlternativesForSearch = [];
      }
    },
    async selectAlternative(alternative) {
      try {
        await axios.post('/api/epg/matching/manual', {
          channelId: this.selectedChannel.channel_id,
          epgSourceChannelId: alternative.id,
          priority: alternative.source_priority
        });

        this.toast.success('Mapping updated successfully!', 3000);
        this.closeAlternativesModal();
        await this.loadData();
      } catch (error) {
        console.error('Error creating manual mapping:', error);
        this.toast.error('Failed to update mapping: ' + (error.response?.data?.error || error.message), 5000);
      }
    },
    async deleteMapping(channelId) {
      const confirmed = await this.confirm.showConfirm({
        title: 'Remove Mapping',
        message: 'Remove this mapping? The channel will become unmapped.',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        type: 'warning'
      });

      if (!confirmed) return;

      try {
        await axios.delete(`/api/epg/matching/channel/${channelId}`);
        this.toast.success('Mapping removed successfully', 3000);
        await this.loadData();
      } catch (error) {
        console.error('Error deleting mapping:', error);
        this.toast.error('Failed to delete mapping: ' + (error.response?.data?.error || error.message), 5000);
      }
    },
    searchAlternatives() {
      // Computed property 'filteredAlternatives' handles the filtering
    },
    async removeManualMapping() {
      const confirmed = await this.confirm.showConfirm({
        title: 'Remove Manual Mapping',
        message: 'Remove manual mapping? The channel will revert to automatic matching.',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        type: 'danger'
      });

      if (!confirmed) return;

      try {
        await axios.delete(`/api/epg/matching/channel/${this.selectedChannel.channel_id}`);
        this.toast.success('Manual mapping removed successfully!', 3000);
        this.closeAlternativesModal();
        await this.loadData();
      } catch (error) {
        console.error('Error removing manual mapping:', error);
        this.toast.error('Failed to remove mapping: ' + (error.response?.data?.error || error.message), 5000);
      }
    },
    closeAlternativesModal() {
      this.showAlternativesModal = false;
      this.selectedChannel = null;
      this.alternatives = [];
      this.allAlternativesForSearch = [];
      this.alternativesSearchQuery = '';
    },
    manualMapChannel(mapping) {
      this.selectedChannel = mapping;
      this.showManualMapModal = true;
      this.epgSearchQuery = '';
      this.epgSearchResults = [];
    },
    async searchEpgChannels() {
      if (!this.epgSearchQuery || this.epgSearchQuery.length < 2) {
        this.epgSearchResults = [];
        return;
      }

      try {
        // Get all EPG sources
        const sourcesRes = await axios.get('/api/epg/sources');
        const enabledSources = sourcesRes.data.filter(s => s.enabled);

        const allChannels = [];

        // Get channels from all enabled sources
        for (const source of enabledSources) {
          try {
            const channelsRes = await axios.get(`/api/epg/channels/source/${source.id}`);
            allChannels.push(...channelsRes.data.map(ch => ({
              ...ch,
              source_name: source.site_name,
              source_priority: source.priority || 999
            })));
          } catch (error) {
            console.warn(`Error loading channels from ${source.site_name}:`, error);
          }
        }

        // Filter by search query and sort by priority
        const query = this.epgSearchQuery.toLowerCase();
        this.epgSearchResults = allChannels
          .filter(ch =>
            ch.display_name?.toLowerCase().includes(query) ||
            ch.xmltv_id?.toLowerCase().includes(query) ||
            ch.site_id?.toLowerCase().includes(query)
          )
          .sort((a, b) => a.source_priority - b.source_priority) // Sort by priority (lower = higher priority)
          .slice(0, 20); // Limit results
      } catch (error) {
        console.error('Error searching EPG channels:', error);
        this.epgSearchResults = [];
      }
    },
    async selectManualMapping(epgChannel) {
      try {
        await axios.post('/api/epg/matching/manual', {
          channelId: this.selectedChannel.channel_id,
          epgSourceChannelId: epgChannel.id,
          priority: epgChannel.source_priority || 999
        });

        this.toast.success('Manual mapping created successfully!', 3000);
        this.closeManualMapModal();
        await this.loadData();
      } catch (error) {
        console.error('Error creating manual mapping:', error);
        this.toast.error('Failed to create mapping: ' + (error.response?.data?.error || error.message), 5000);
      }
    },
    closeManualMapModal() {
      this.showManualMapModal = false;
      this.selectedChannel = null;
      this.epgSearchQuery = '';
      this.epgSearchResults = [];
    },
    getMatchQualityClass(quality, isManual) {
      if (isManual) {
        return 'bg-blue-100 text-blue-800';
      }
      switch (quality) {
        case 'exact':
          return 'bg-green-100 text-green-800';
        case 'fuzzy':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  }
};
</script>
