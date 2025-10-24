<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">⚙️ Settings</h1>
        <p class="mt-2 text-gray-600">
          Configure IPTV Manager settings and EPG sources
        </p>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="activeTab = 'general'"
              :class="[
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              General
            </button>
            <button
              @click="activeTab = 'epg'"
              :class="[
                activeTab === 'epg'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              EPG
            </button>
            <button
              @click="activeTab = 'advanced'"
              :class="[
                activeTab === 'advanced'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              Advanced
            </button>
          </nav>
        </div>
      </div>

      <!-- General Tab Content -->
      <div v-if="activeTab === 'general'">
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
                  /output/playlist.m3u
                </code>
                <p class="text-xs text-gray-500 mt-2">
                  Your exported M3U playlist with all enabled channels
                </p>
              </div>
              <button
                @click="copyToClipboard('/output/playlist.m3u')"
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
                  /api/epg/xml
                </code>
                <p class="text-xs text-gray-500 mt-2">
                  Electronic Program Guide in XMLTV format (generated from EPG Matching)
                </p>
              </div>
              <button
                @click="copyToClipboard('/api/epg/xml')"
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

      <!-- Integrations Card -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center">
          <svg class="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
          </svg>
          Integrations
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          Configure external service integrations
        </p>

        <!-- Emby Integration -->
        <div class="border rounded-lg p-4 bg-gray-50">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
              </svg>
              <div>
                <h3 class="font-semibold text-gray-900">Emby Media Server</h3>
                <p class="text-xs text-gray-500">Automatically refresh libraries after STRM file changes</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="embyEnabled"
                @change="toggleEmbyIntegration"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span class="ml-3 text-sm font-medium text-gray-700">{{ embyEnabled ? 'Enabled' : 'Disabled' }}</span>
            </label>
          </div>

          <!-- Emby Config (shown only when enabled) -->
          <div v-if="embyEnabled" class="mt-4 space-y-3 pl-11">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Server URL
              </label>
              <input
                v-model="embyConfig.serverUrl"
                type="url"
                placeholder="http://localhost:8096"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                v-model="embyConfig.apiToken"
                type="password"
                placeholder="Your Emby API Token"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              @click="saveEmbyConfig"
              :disabled="isSavingEmby || !embyConfig.serverUrl || !embyConfig.apiToken"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <svg v-if="isSavingEmby" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSavingEmby ? 'Saving...' : 'Save Configuration' }}
            </button>
          </div>
        </div>
      </div>
      </div>

      <!-- EPG Tab Content -->
      <div v-if="activeTab === 'epg'">
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
                  /output/playlist.m3u
                </code>
                <p class="text-xs text-gray-500 mt-2">
                  Your exported M3U playlist with all enabled channels
                </p>
              </div>
              <button
                @click="copyToClipboard('/output/playlist.m3u')"
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
                  /api/epg/xml
                </code>
                <p class="text-xs text-gray-500 mt-2">
                  Electronic Program Guide in XMLTV format (generated from EPG Matching)
                </p>
              </div>
              <button
                @click="copyToClipboard('/api/epg/xml')"
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
      <!-- End EPG Tab Content -->

      <!-- Advanced Tab Content -->
      <div v-if="activeTab === 'advanced'">
        <!-- Danger Zone Card -->
        <div class="bg-red-50 border-2 border-red-300 rounded-lg shadow p-6 mb-6">
          <h2 class="text-2xl font-semibold text-red-600 mb-2 flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            Danger Zone
          </h2>
          <p class="text-sm text-red-700 mb-6">
            These actions will permanently delete data from the database. <strong>These actions cannot be undone!</strong>
          </p>

          <div class="space-y-4">
            <!-- TV Channels Section -->
            <div class="bg-white rounded-lg p-4 border border-red-200">
              <h3 class="font-semibold text-gray-900 mb-3">📺 TV Channels Data</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <button
                    @click="resetChannels"
                    :disabled="resetting"
                    class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    {{ resetting ? 'Resetting...' : 'Reset Channels Only' }}
                  </button>
                  <span class="text-sm text-gray-600">Delete all channels and EPG mappings (keep groups)</span>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    @click="resetGroups"
                    :disabled="resetting"
                    class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    {{ resetting ? 'Resetting...' : 'Reset Groups Only' }}
                  </button>
                  <span class="text-sm text-gray-600">Delete all groups (except Unassigned), move channels to Unassigned</span>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    @click="resetEpgMappings"
                    :disabled="resetting"
                    class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    {{ resetting ? 'Resetting...' : 'Reset EPG Mappings Only' }}
                  </button>
                  <span class="text-sm text-gray-600">Delete all EPG mappings (keep channels and groups)</span>
                </div>
                <div class="border-t pt-3 mt-3"></div>
                <div class="flex items-center gap-3">
                  <button
                    @click="resetAllTvData"
                    :disabled="resetting"
                    class="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-sm"
                  >
                    {{ resetting ? 'Resetting...' : 'Reset All TV Data' }}
                  </button>
                  <span class="text-sm text-red-600 font-semibold">⚠️ Delete ALL TV data: channels, groups, and EPG mappings (movies NOT affected)</span>
                </div>
              </div>
            </div>

            <!-- Movies Section -->
            <div class="bg-white rounded-lg p-4 border border-red-200">
              <h3 class="font-semibold text-gray-900 mb-3">🎬 Movies Data</h3>
              <div class="flex items-center gap-3">
                <button
                  @click="resetMovies"
                  :disabled="resetting"
                  class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  {{ resetting ? 'Resetting...' : 'Reset All Movies' }}
                </button>
                <span class="text-sm text-gray-600">Delete all movies and STRM files (TV channels NOT affected)</span>
              </div>
            </div>

            <!-- Nuclear Option -->
            <div class="bg-red-100 rounded-lg p-4 border-2 border-red-400">
              <h3 class="font-bold text-red-900 mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                🚨 Nuclear Option
              </h3>
              <div class="flex items-center gap-3">
                <button
                  @click="resetAll"
                  :disabled="resetting"
                  class="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-sm"
                >
                  {{ resetting ? 'Resetting...' : 'Reset EVERYTHING' }}
                </button>
                <span class="text-sm text-red-900 font-bold">⚠️ DELETE EVERYTHING: All channels, groups, movies, STRM files, and EPG mappings</span>
              </div>
            </div>

            <!-- Status message -->
            <div v-if="resetStatusMessage" :class="resetStatusType === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'" class="p-4 rounded-md border">
              <p class="font-medium">{{ resetStatusMessage }}</p>
            </div>
          </div>
        </div>
      </div>
      <!-- End Advanced Tab Content -->

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
      activeTab: 'general', // 'general', 'epg', or 'advanced'
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
      },
      // Danger Zone
      resetting: false,
      resetStatusMessage: '',
      resetStatusType: '',
      // Emby Integration
      embyEnabled: false,
      embyConfig: {
        serverUrl: '',
        apiToken: ''
      },
      isSavingEmby: false
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const [sourcesRes, configRes, statusRes, embyRes] = await Promise.all([
          axios.get('/api/epg/sources'),
          axios.get('/api/epg/config'),
          axios.get('/api/epg/status'),
          axios.get('/api/movies/emby-config')
        ]);

        // Sort sources by priority (1 = highest = first)
        this.sources = sourcesRes.data.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        this.config = configRes.data;
        this.status = statusRes.data;

        // Load Emby config
        if (embyRes.data.data) {
          this.embyConfig = {
            serverUrl: embyRes.data.data.emby_server_url || '',
            apiToken: embyRes.data.data.emby_api_token || ''
          };
          // Load emby_enabled flag from database
          this.embyEnabled = embyRes.data.data.emby_enabled === true;
        }
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
          await axios.put(`/api/epg/sources/${update.id}`, {
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
        await axios.put('/api/epg/config', {
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
        await axios.put(`/api/epg/sources/${source.id}`, {
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
          await axios.put(`/api/epg/sources/${this.editingSource.id}`, this.sourceForm);
          this.addToast('Source updated successfully', 'success');
        } else {
          await axios.post('/api/epg/sources', this.sourceForm);
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
        await axios.delete(`/api/epg/sources/${source.id}`);
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
    },
    // Danger Zone methods
    async resetChannels() {
      if (!confirm('⚠️ WARNING: This will delete ALL channels and EPG mappings!\n\nGroups will be preserved.\n\nAre you sure?')) {
        return;
      }

      this.resetting = true;
      this.resetStatusMessage = '';

      try {
        const response = await axios.post('/api/channels/reset/all');
        this.resetStatusType = 'success';
        this.resetStatusMessage = response.data.message;
        this.addToast('Channels reset successfully', 'success');
      } catch (error) {
        this.resetStatusType = 'error';
        this.resetStatusMessage = error.response?.data?.error || 'Reset failed';
        this.addToast('Failed to reset channels', 'error');
      } finally {
        this.resetting = false;
      }
    },
    async resetGroups() {
      if (!confirm('⚠️ WARNING: This will delete ALL groups (except Unassigned)!\n\nAll channels will be moved to Unassigned group.\n\nAre you sure?')) {
        return;
      }

      this.resetting = true;
      this.resetStatusMessage = '';

      try {
        const response = await axios.post('/api/groups/reset/all');
        this.resetStatusType = 'success';
        this.resetStatusMessage = response.data.message;
        this.addToast('Groups reset successfully', 'success');
      } catch (error) {
        this.resetStatusType = 'error';
        this.resetStatusMessage = error.response?.data?.error || 'Reset failed';
        this.addToast('Failed to reset groups', 'error');
      } finally {
        this.resetting = false;
      }
    },
    async resetEpgMappings() {
      if (!confirm('⚠️ This will delete ALL EPG mappings!\n\nChannels and groups will be preserved.\n\nYou will need to re-run auto-matching.\n\nAre you sure?')) {
        return;
      }

      this.resetting = true;
      this.resetStatusMessage = '';

      try {
        const response = await axios.post('/api/reset/epg-mappings');
        this.resetStatusType = 'success';
        this.resetStatusMessage = response.data.message;
        this.addToast('EPG mappings reset successfully', 'success');
      } catch (error) {
        this.resetStatusType = 'error';
        this.resetStatusMessage = error.response?.data?.error || 'Reset failed';
        this.addToast('Failed to reset EPG mappings', 'error');
      } finally {
        this.resetting = false;
      }
    },
    async resetMovies() {
      if (!confirm('⚠️ WARNING: This will delete ALL movies and STRM files!\n\nTV channels and groups will NOT be affected.\n\nAre you sure?')) {
        return;
      }

      this.resetting = true;
      this.resetStatusMessage = '';

      try {
        const response = await axios.post('/api/movies/reset/all');
        this.resetStatusType = 'success';
        this.resetStatusMessage = response.data.message;
        this.addToast('Movies reset successfully', 'success');
      } catch (error) {
        this.resetStatusType = 'error';
        this.resetStatusMessage = error.response?.data?.error || 'Reset failed';
        this.addToast('Failed to reset movies', 'error');
      } finally {
        this.resetting = false;
      }
    },
    async resetAllTvData() {
      if (!confirm('🚨 EXTREME DANGER 🚨\n\nThis will delete ALL TV data:\n- All channels\n- All groups (except Unassigned)\n- All EPG mappings\n\nMovies will NOT be affected.\n\nThis action CANNOT be undone!\n\nAre you ABSOLUTELY sure?')) {
        return;
      }

      if (!confirm('LAST WARNING: Click OK to permanently delete all TV data.\n\nThere is NO going back!')) {
        return;
      }

      this.resetting = true;
      this.resetStatusMessage = '';

      try {
        const response = await axios.post('/api/reset/tv-all');
        this.resetStatusType = 'success';
        this.resetStatusMessage = response.data.message;
        this.addToast('All TV data reset successfully', 'success');
      } catch (error) {
        this.resetStatusType = 'error';
        this.resetStatusMessage = error.response?.data?.error || 'Reset failed';
        this.addToast('Failed to reset TV data', 'error');
      } finally {
        this.resetting = false;
      }
    },
    async resetAll() {
      if (!confirm('🚨 EXTREME DANGER 🚨\n\nThis will delete EVERYTHING:\n- All channels\n- All groups (except Unassigned)\n- All movies\n- All STRM files\n- All EPG mappings\n\nThis action CANNOT be undone!\n\nAre you ABSOLUTELY sure?')) {
        return;
      }

      if (!confirm('LAST WARNING: Click OK to permanently delete everything.\n\nThere is NO going back!')) {
        return;
      }

      this.resetting = true;
      this.resetStatusMessage = '';

      try {
        const response = await axios.post('/api/reset/all');
        this.resetStatusType = 'success';
        this.resetStatusMessage = response.data.message;
        this.addToast('All data reset successfully', 'success');
      } catch (error) {
        this.resetStatusType = 'error';
        this.resetStatusMessage = error.response?.data?.error || 'Reset failed';
        this.addToast('Failed to reset all data', 'error');
      } finally {
        this.resetting = false;
      }
    },
    // Emby Integration methods
    async toggleEmbyIntegration() {
      // Save the emby_enabled state immediately when toggle changes
      try {
        await axios.put('/api/movies/emby-config', {
          emby_enabled: this.embyEnabled,
          emby_server_url: this.embyConfig.serverUrl,
          emby_api_token: this.embyConfig.apiToken
        });

        if (this.addToast) {
          this.addToast(
            this.embyEnabled ? 'Emby integration enabled' : 'Emby integration disabled',
            'success'
          );
        }

        // Notify MoviesView about the change
        window.dispatchEvent(new CustomEvent('emby-config-updated', {
          detail: {
            enabled: this.embyEnabled,
            configured: !!(this.embyConfig.serverUrl && this.embyConfig.apiToken)
          }
        }));
      } catch (error) {
        console.error('Error toggling Emby integration:', error);
        console.log('this:', this);
        console.log('this.addToast:', this.addToast);
        // Revert toggle on error
        this.embyEnabled = !this.embyEnabled;
        if (this.addToast) {
          this.addToast('Failed to update Emby integration', 'error');
        }
      }
    },
    async saveEmbyConfig() {
      if (!this.embyConfig.serverUrl || !this.embyConfig.apiToken) {
        this.addToast('Please fill all Emby fields', 'error');
        return;
      }

      this.isSavingEmby = true;
      try {
        await axios.put('/api/movies/emby-config', {
          emby_server_url: this.embyConfig.serverUrl,
          emby_api_token: this.embyConfig.apiToken,
          emby_enabled: this.embyEnabled
        });
        this.addToast('Emby configuration saved successfully', 'success');

        // Emit event to notify MoviesView
        window.dispatchEvent(new CustomEvent('emby-config-updated', {
          detail: {
            enabled: this.embyEnabled,
            configured: true
          }
        }));
      } catch (error) {
        console.error('Error saving Emby config:', error);
        this.addToast(
          error.response?.data?.message || 'Failed to save Emby configuration',
          'error'
        );
      } finally {
        this.isSavingEmby = false;
      }
    }
  }
};
</script>
