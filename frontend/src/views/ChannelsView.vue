<template>
  <div class="px-4 py-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">📺 TV Channels</h2>

    <!-- Tabs Navigation -->
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
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
          <button
            @click="activeTab = 'manage'"
            :class="[
              activeTab === 'manage'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
            Manage
          </button>
          <button
            @click="activeTab = 'epg-matching'"
            :class="[
              activeTab === 'epg-matching'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            EPG Matching
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="bg-white shadow rounded-lg p-6">
      <ChannelsImportTab v-if="activeTab === 'import'" />
      <ChannelsManageTab v-if="activeTab === 'manage'" />
      <ChannelsEpgMatchingTab v-if="activeTab === 'epg-matching'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChannelsImportTab from '../components/channels/ChannelsImportTab.vue'
import ChannelsManageTab from '../components/channels/ChannelsManageTab.vue'
import ChannelsEpgMatchingTab from '../components/channels/ChannelsEpgMatchingTab.vue'

const activeTab = ref('import')
</script>
