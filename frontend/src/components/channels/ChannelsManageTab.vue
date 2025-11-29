<template>
  <div class="px-3 sm:px-4 py-4 sm:py-6">
    <!-- Header: responsive layout -->
    <div class="mb-4 sm:mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-0">Manage Channels</h2>
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          @click="toggleBulkMode"
          :class="[
            'min-h-touch sm:min-h-0 px-4 py-3 sm:py-2 rounded-md font-medium transition-colors text-sm sm:text-base',
            bulkEditMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ bulkEditMode ? '✓ Bulk Edit Mode' : 'Bulk Edit Mode' }}
        </button>
        <button
          @click="showNewGroupModal = true"
          class="min-h-touch sm:min-h-0 bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base"
        >
          + New Group
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search channels by name, logo URL, or tvg-id..."
          class="block w-full pl-10 pr-10 py-3 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
        />
        <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
          <button
            @click="searchQuery = ''"
            class="p-2 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <svg class="h-5 w-5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="searchQuery && filteredChannelsCount < channels.length" class="mt-2 text-sm text-gray-600">
        Showing {{ filteredChannelsCount }} of {{ channels.length }} channels
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-600">Loading channels...</p>
    </div>

    <!-- No results message -->
    <div v-else-if="searchQuery && filteredChannelsCount === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No channels found</h3>
      <p class="mt-1 text-sm text-gray-500">Try adjusting your search query</p>
      <button
        @click="searchQuery = ''"
        class="mt-4 min-h-touch px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Clear Search
      </button>
    </div>

    <!-- Groups list -->
    <div v-else class="space-y-4">
      <draggable
        v-model="groups"
        item-key="id"
        @end="onGroupsReordered"
        handle=".drag-handle"
        class="space-y-4"
      >
        <template #item="{ element: group }">
      <div
        v-if="!searchQuery || getGroupChannelCount(group.id) > 0"
        :class="[
          'shadow rounded-lg overflow-hidden',
          isUnassignedGroup(group) ? 'bg-orange-50 border-2 border-orange-300' : 'bg-white'
        ]"
      >
        <!-- Group header: responsive layout -->
        <div :class="[
          'px-3 sm:px-4 py-3 border-b',
          isUnassignedGroup(group) ? 'bg-orange-100 border-orange-300' : 'bg-gray-50'
        ]">
          <!-- Mobile: stacked layout -->
          <div class="flex flex-col gap-3 sm:hidden">
            <!-- Top row: icon, checkbox, name, expand button -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  v-if="!isUnassignedGroup(group)"
                  class="drag-handle cursor-move text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                  </svg>
                </button>
                <svg v-else class="w-5 h-5 text-orange-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <input
                  v-if="!isUnassignedGroup(group)"
                  type="checkbox"
                  :checked="group.is_exported === 1"
                  @change="toggleGroupExport(group)"
                  class="h-5 w-5 text-blue-600 rounded"
                  title="Include in export"
                />
                <div class="flex flex-col">
                  <span
                    :class="[
                      'text-base font-medium',
                      isUnassignedGroup(group) ? 'text-orange-900' : 'text-gray-900'
                    ]"
                  >
                    {{ isUnassignedGroup(group) ? '⚠️ ' : '' }}{{ group.name }}
                  </span>
                  <span class="text-xs text-gray-500">({{ getGroupChannelCount(group.id) }} channels)</span>
                </div>
              </div>
              <button
                @click="toggleGroupExpanded(group.id)"
                class="p-2 text-gray-600 hover:text-gray-700"
              >
                {{ expandedGroups.has(group.id) ? '▼' : '▶' }}
              </button>
            </div>

            <!-- Bottom row: badges and actions -->
            <div class="flex items-center justify-between gap-2 pl-9">
              <div class="flex gap-2">
                <span v-if="getGroupSelectedCount(group.id) > 0" class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {{ getGroupSelectedCount(group.id) }} selected
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="bulkEditMode && getGroupSelectedCount(group.id) > 0"
                  @click="openBulkEdit(group.id)"
                  class="text-purple-600 hover:text-purple-700 text-xs font-medium whitespace-nowrap px-3 py-2"
                >
                  Move ({{ getGroupSelectedCount(group.id) }})
                </button>
                <button
                  v-if="!isUnassignedGroup(group)"
                  @click="editGroup(group)"
                  class="text-blue-600 hover:text-blue-700 text-sm px-3 py-2"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop: original horizontal layout -->
          <div class="hidden sm:flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button
                v-if="!isUnassignedGroup(group)"
                class="drag-handle cursor-move text-gray-400 hover:text-gray-600"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                </svg>
              </button>
              <svg v-else class="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <input
                v-if="!isUnassignedGroup(group)"
                type="checkbox"
                :checked="group.is_exported === 1"
                @change="toggleGroupExport(group)"
                class="h-4 w-4 text-blue-600 rounded"
                title="Include in export"
              />
              <span
                :class="[
                  'text-lg font-medium',
                  isUnassignedGroup(group) ? 'text-orange-900' : 'text-gray-900'
                ]"
              >
                {{ isUnassignedGroup(group) ? '⚠️ ' : '' }}{{ group.name }}
              </span>
              <span class="text-sm text-gray-500">({{ getGroupChannelCount(group.id) }} channels)</span>
              <span v-if="getGroupSelectedCount(group.id) > 0" class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                {{ getGroupSelectedCount(group.id) }} selected
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <button
                v-if="bulkEditMode && getGroupSelectedCount(group.id) > 0"
                @click="openBulkEdit(group.id)"
                class="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Move Selected ({{ getGroupSelectedCount(group.id) }})
              </button>
              <button
                v-if="!isUnassignedGroup(group)"
                @click="editGroup(group)"
                class="text-blue-600 hover:text-blue-700 text-sm"
              >
                Edit
              </button>
              <button
                @click="toggleGroupExpanded(group.id)"
                class="text-gray-600 hover:text-gray-700"
              >
                {{ expandedGroups.has(group.id) ? '▼' : '▶' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Channels list (expandable) -->
        <div v-if="expandedGroups.has(group.id)" class="p-3 sm:p-4">
          <div v-if="getGroupChannels(group.id).length === 0" class="text-gray-500 text-sm">
            No channels in this group
          </div>
          <draggable
            v-else
            :model-value="getGroupChannels(group.id)"
            @update:model-value="(newOrder) => updateChannelOrder(group.id, newOrder)"
            item-key="id"
            handle=".channel-drag-handle"
            class="space-y-2"
          >
            <template #item="{ element: channel }">
            <div>
              <!-- Mobile: card layout -->
              <div class="sm:hidden bg-gray-50 rounded p-3 hover:bg-gray-100">
                <div class="flex items-start gap-2 mb-2">
                  <button class="channel-drag-handle cursor-move text-gray-400 hover:text-gray-600 p-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                    </svg>
                  </button>
                  <input
                    v-if="bulkEditMode"
                    type="checkbox"
                    :checked="channel.selected"
                    @click="handleBulkSelectionClick(channel, group.id, $event)"
                    class="h-5 w-5 text-purple-600 rounded mt-1"
                    title="Select for bulk move"
                  />
                  <input
                    type="checkbox"
                    :checked="channel.is_exported === 1"
                    @click="handleExportClick(channel, group.id, $event)"
                    class="h-5 w-5 text-blue-600 rounded mt-1"
                    title="Include in export"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 text-sm break-words">
                      {{ channel.is_name_overridden ? channel.custom_tvg_name : channel.imported_tvg_name }}
                      <span v-if="channel.is_name_overridden || channel.is_logo_overridden || channel.is_group_overridden" class="text-xs text-blue-600 ml-1">★</span>
                      <span v-if="channel.original_tvg_id" class="text-xs text-orange-600 ml-1" :title="'Original tvg-id: ' + channel.original_tvg_id">↻</span>
                    </p>
                    <p class="text-xs text-gray-500 mt-1 break-all">
                      ID: {{ channel.tvg_id }}
                    </p>
                    <p v-if="channel.original_tvg_id" class="text-xs text-orange-500 mt-1 break-all">
                      Renamed from: {{ channel.original_tvg_id }}
                    </p>
                  </div>
                </div>
                <button
                  @click="editChannel(channel)"
                  class="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2 px-3 bg-white rounded border border-blue-200 hover:border-blue-300"
                >
                  Edit
                </button>
              </div>

              <!-- Desktop: horizontal layout -->
              <div class="hidden sm:flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100">
                <div class="flex items-center space-x-3">
                  <button class="channel-drag-handle cursor-move text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                    </svg>
                  </button>
                  <input
                    v-if="bulkEditMode"
                    type="checkbox"
                    :checked="channel.selected"
                    @click="handleBulkSelectionClick(channel, group.id, $event)"
                    class="h-4 w-4 text-purple-600 rounded"
                    title="Select for bulk move (Shift+Click for range)"
                  />
                  <input
                    type="checkbox"
                    :checked="channel.is_exported === 1"
                    @click="handleExportClick(channel, group.id, $event)"
                    class="h-4 w-4 text-blue-600 rounded"
                    title="Include in export (Shift+Click for range)"
                  />
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">
                      {{ channel.is_name_overridden ? channel.custom_tvg_name : channel.imported_tvg_name }}
                      <span v-if="channel.is_name_overridden || channel.is_logo_overridden || channel.is_group_overridden" class="text-xs text-blue-600 ml-1">★</span>
                      <span v-if="channel.original_tvg_id" class="text-xs text-orange-600 ml-1" :title="'Original tvg-id: ' + channel.original_tvg_id">↻</span>
                    </p>
                    <p class="text-sm text-gray-500">
                      ID: {{ channel.tvg_id }}
                      <span v-if="channel.original_tvg_id" class="text-xs text-orange-500 ml-1">(renamed from: {{ channel.original_tvg_id }})</span>
                    </p>
                  </div>
                </div>
                <button
                  @click="editChannel(channel)"
                  class="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
            </template>
          </draggable>
        </div>
      </div>
        </template>
      </draggable>

      <div v-if="groups.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
        <p class="text-gray-600">No groups found. Import an M3U file to get started.</p>
      </div>
    </div>

    <!-- New Group Modal -->
    <div v-if="showNewGroupModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
        <h3 class="text-base sm:text-lg font-medium mb-4">Create New Group</h3>
        <input
          v-model="newGroupName"
          type="text"
          placeholder="Group name"
          class="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-base"
          @keyup.enter="createGroup"
        />
        <div class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2">
          <button
            @click="showNewGroupModal = false; newGroupName = ''"
            class="min-h-touch sm:min-h-0 px-4 py-3 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="createGroup"
            :disabled="!newGroupName.trim()"
            class="min-h-touch sm:min-h-0 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modals -->
    <ChannelEditModal
      :show="showChannelEditModal"
      :channel="selectedChannel"
      :groups="groups"
      @close="showChannelEditModal = false"
      @saved="handleChannelSaved"
    />

    <GroupEditModal
      :show="showGroupEditModal"
      :group="selectedGroup"
      :channelCount="selectedGroup ? getGroupChannelCount(selectedGroup.id) : 0"
      @close="showGroupEditModal = false"
      @saved="handleGroupSaved"
      @deleted="handleGroupDeleted"
      @delete-with-channels="handleDeleteGroupWithChannels"
    />

    <!-- Delete Group Options Modal -->
    <div v-if="showDeleteOptionsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-start space-x-3 mb-4">
          <svg class="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <div class="flex-1">
            <h3 class="text-lg font-medium text-gray-900">Delete Group with Channels</h3>
            <p class="text-sm text-gray-600 mt-1">
              The group "{{ groupToDelete?.name }}" contains {{ getGroupChannelCount(groupToDelete?.id) }} channel(s).
              What would you like to do with these channels?
            </p>
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" :class="deleteOption === 'unassign' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'">
            <input
              type="radio"
              v-model="deleteOption"
              value="unassign"
              class="mt-1 h-4 w-4 text-blue-600"
            />
            <div class="ml-3">
              <span class="block font-medium text-gray-900">Move to "Unassigned Channels"</span>
              <span class="block text-sm text-gray-600">Channels will be moved to the special "Unassigned Channels" group</span>
            </div>
          </label>

          <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" :class="deleteOption === 'move' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'">
            <input
              type="radio"
              v-model="deleteOption"
              value="move"
              class="mt-1 h-4 w-4 text-blue-600"
            />
            <div class="ml-3 flex-1">
              <span class="block font-medium text-gray-900">Move to another group</span>
              <span class="block text-sm text-gray-600 mb-2">Select destination group:</span>
              <select
                v-model="deleteTargetGroup"
                :disabled="deleteOption !== 'move'"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Group --</option>
                <option v-for="group in groups.filter(g => g.id !== groupToDelete?.id)" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </div>
          </label>

          <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50" :class="deleteOption === 'delete' ? 'border-red-500 bg-red-50' : 'border-gray-300'">
            <input
              type="radio"
              v-model="deleteOption"
              value="delete"
              class="mt-1 h-4 w-4 text-red-600"
            />
            <div class="ml-3">
              <span class="block font-medium text-red-900">Delete channels permanently</span>
              <span class="block text-sm text-red-700">⚠️ This action cannot be undone!</span>
            </div>
          </label>
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2">
          <button
            @click="cancelDeleteGroup"
            class="min-h-touch sm:min-h-0 px-4 py-3 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="executeDeleteGroup"
            :disabled="deleteOption === 'move' && !deleteTargetGroup"
            class="min-h-touch sm:min-h-0 px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300"
          >
            Delete Group
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Move Modal -->
    <div v-if="showBulkEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
        <h3 class="text-base sm:text-lg font-medium mb-4">Move {{ channels.filter(ch => ch.selected).length }} Channel(s)</h3>
        <p class="text-sm text-gray-600 mb-4">Select the destination group for the selected channels:</p>
        <select
          v-model="bulkMoveTargetGroup"
          class="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 text-base"
        >
          <option value="">-- Select Group --</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
        <div class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-2">
          <button
            @click="cancelBulkEdit"
            class="min-h-touch sm:min-h-0 px-4 py-3 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="executeBulkMove"
            :disabled="!bulkMoveTargetGroup"
            class="min-h-touch sm:min-h-0 px-4 py-3 sm:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300"
          >
            Move Channels
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// v0.3.0 - Fixed group creation with is_special column
import { ref, onMounted, onActivated, nextTick, reactive, computed, watch } from 'vue'
import axios from 'axios'
import draggable from 'vuedraggable'
import ChannelEditModal from '../shared/ChannelEditModal.vue'
import GroupEditModal from '../shared/GroupEditModal.vue'
import { useToast } from '../../composables/useToast'

const { success, error: showError } = useToast()

const loading = ref(true)
const groups = ref([])
const channels = ref([])
const expandedGroups = ref(new Set())
const showNewGroupModal = ref(false)
const newGroupName = ref('')
const showChannelEditModal = ref(false)
const selectedChannel = ref(null)
const showGroupEditModal = ref(false)
const selectedGroup = ref(null)
const showBulkEditModal = ref(false)
const bulkMoveTargetGroup = ref('')
const bulkEditMode = ref(false)
const lastSelectedChannel = ref(null)
const lastExportChannel = ref(null)
const showDeleteOptionsModal = ref(false)
const groupToDelete = ref(null)
const deleteOption = ref('unassign')
const deleteTargetGroup = ref('')
const searchQuery = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const [groupsRes, channelsRes] = await Promise.all([
      axios.get('/api/groups'),
      axios.get('/api/channels')
    ])
    groups.value = groupsRes.data
    // Initialize 'selected' property for all channels to make it reactive
    channels.value = channelsRes.data.map(ch => ({
      ...ch,
      selected: ch.selected || false
    }))
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

const UNASSIGNED_GROUP_ID = '00000000-0000-0000-0000-000000000000'

const isUnassignedGroup = (group) => {
  return group && group.id === UNASSIGNED_GROUP_ID
}

// Filter channels based on search query
const matchesSearch = (channel) => {
  if (!searchQuery.value) return true

  const query = searchQuery.value.toLowerCase()
  const name = (channel.is_name_overridden ? channel.custom_tvg_name : channel.imported_tvg_name)?.toLowerCase() || ''
  const tvgId = channel.tvg_id?.toLowerCase() || ''
  const logo = (channel.is_logo_overridden ? channel.custom_tvg_logo : channel.imported_tvg_logo)?.toLowerCase() || ''

  return name.includes(query) || tvgId.includes(query) || logo.includes(query)
}

const getGroupChannels = (groupId) => {
  return channels.value.filter(ch =>
    ch.custom_group_id === groupId && matchesSearch(ch)
  )
}

const getGroupChannelCount = (groupId) => {
  return getGroupChannels(groupId).length
}

// Computed property to count total filtered channels
const filteredChannelsCount = computed(() => {
  if (!searchQuery.value) return channels.value.length
  return channels.value.filter(ch => matchesSearch(ch)).length
})

const toggleGroupExpanded = (groupId) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

const toggleGroupExport = async (group) => {
  try {
    const newValue = group.is_exported === 1 ? 0 : 1
    await axios.put(`/api/groups/${group.id}`, {
      is_exported: newValue
    })
    // Update only the local state, no reload
    group.is_exported = newValue
  } catch (error) {
    console.error('Failed to update group:', error)
    showError('Failed to update group export status')
  }
}

const handleExportClick = async (channel, groupId, event) => {
  // Prevent default to control checkbox state manually
  event.preventDefault()

  if (event.shiftKey && lastExportChannel.value) {
    // Shift-click: update range
    const groupChannels = getGroupChannels(groupId)
    const lastIndex = groupChannels.findIndex(ch => ch.id === lastExportChannel.value.id)
    const currentIndex = groupChannels.findIndex(ch => ch.id === channel.id)

    if (lastIndex !== -1) {
      // Determine the new state (same as the current channel will have)
      const newState = channel.is_exported === 1 ? 0 : 1

      // Select range
      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)

      try {
        // Update all channels in range
        await Promise.all(
          groupChannels.slice(start, end + 1).map(ch =>
            axios.put(`/api/channels/${ch.id}`, {
              is_exported: newState
            }).then(() => {
              ch.is_exported = newState
            })
          )
        )
        lastExportChannel.value = channel
        return
      } catch (error) {
        console.error('Failed to update channels:', error)
        showError('Failed to update export status for range')
        return
      }
    }
  }

  // Normal click: toggle single channel
  try {
    const newValue = channel.is_exported === 1 ? 0 : 1
    await axios.put(`/api/channels/${channel.id}`, {
      is_exported: newValue
    })
    channel.is_exported = newValue
    lastExportChannel.value = channel
  } catch (error) {
    console.error('Failed to update channel:', error)
    showError('Failed to update channel export status')
  }
}

const createGroup = async () => {
  if (!newGroupName.value.trim()) return

  try {
    await axios.post('/api/groups', { name: newGroupName.value.trim() })
    showNewGroupModal.value = false
    newGroupName.value = ''
    await loadData()
    success('Group created successfully')
  } catch (err) {
    console.error('Failed to create group:', err)
    // Show specific error message from backend
    const errorMsg = err.response?.data?.error || 'Failed to create group'
    showError(errorMsg)
  }
}

const editGroup = (group) => {
  selectedGroup.value = group
  showGroupEditModal.value = true
}

const editChannel = (channel) => {
  selectedChannel.value = channel
  showChannelEditModal.value = true
}

const handleChannelSaved = async () => {
  await loadData()
  success('Channel updated successfully')
}

const handleGroupSaved = async () => {
  await loadData()
  success('Group updated successfully')
}

const handleGroupDeleted = async () => {
  await loadData()
  success('Group deleted successfully')
}

const handleDeleteGroupWithChannels = (group) => {
  groupToDelete.value = group
  deleteOption.value = 'unassign'
  deleteTargetGroup.value = ''
  showDeleteOptionsModal.value = true
  showGroupEditModal.value = false
}

const cancelDeleteGroup = () => {
  showDeleteOptionsModal.value = false
  groupToDelete.value = null
  deleteOption.value = 'unassign'
  deleteTargetGroup.value = ''
}

const executeDeleteGroup = async () => {
  if (!groupToDelete.value) return

  if (deleteOption.value === 'move' && !deleteTargetGroup.value) {
    showError('Please select a destination group')
    return
  }

  try {
    const groupId = groupToDelete.value.id

    // Handle channels based on selected option
    if (deleteOption.value === 'move') {
      // Move channels to target group
      const channelsToMove = getGroupChannels(groupId)
      await Promise.all(
        channelsToMove.map(channel =>
          axios.put(`/api/channels/${channel.id}`, {
            custom_group_id: deleteTargetGroup.value
          })
        )
      )
    } else if (deleteOption.value === 'delete') {
      // Delete all channels in group
      const channelsToDelete = getGroupChannels(groupId)
      await Promise.all(
        channelsToDelete.map(channel =>
          axios.delete(`/api/channels/${channel.id}`)
        )
      )
    }
    // If 'unassign', do nothing - backend will set custom_group_id to NULL

    // Delete the group
    await axios.delete(`/api/groups/${groupId}`)

    // Close modal and reload
    showDeleteOptionsModal.value = false
    groupToDelete.value = null
    await loadData()

    const actionMsg = deleteOption.value === 'move'
      ? 'Group deleted and channels moved'
      : deleteOption.value === 'delete'
      ? 'Group and channels deleted'
      : 'Group deleted, channels moved to Unassigned'

    success(actionMsg)
  } catch (error) {
    console.error('Failed to delete group:', error)
    showError('Failed to delete group')
  }
}

const onGroupsReordered = async () => {
  try {
    const groupIds = groups.value.map(g => g.id)
    await axios.put('/api/groups/reorder/all', { groupIds })
  } catch (error) {
    console.error('Failed to reorder groups:', error)
    await loadData() // Reload to revert on error
  }
}

const updateChannelOrder = async (groupId, newOrder) => {
  try {
    // Update local channels array to reflect new order
    const channelIds = newOrder.map(ch => ch.id)

    // Update the channels array with new order
    const otherChannels = channels.value.filter(ch => ch.custom_group_id !== groupId)
    channels.value = [...otherChannels, ...newOrder]

    // Send to backend
    await axios.put('/api/channels/reorder/group', { channelIds })
  } catch (error) {
    console.error('Failed to reorder channels:', error)
    await loadData() // Reload to revert on error
  }
}

const onChannelsReordered = async (groupId) => {
  try {
    const groupChannels = getGroupChannels(groupId)
    const channelIds = groupChannels.map(ch => ch.id)
    await axios.put('/api/channels/reorder/group', { channelIds })
  } catch (error) {
    console.error('Failed to reorder channels:', error)
    await loadData() // Reload to revert on error
  }
}

const toggleBulkMode = () => {
  bulkEditMode.value = !bulkEditMode.value
  if (!bulkEditMode.value) {
    // Clear selections when exiting bulk mode
    channels.value.forEach(ch => ch.selected = false)
    lastSelectedChannel.value = null
  }
}

const handleBulkSelectionClick = (channel, groupId, event) => {
  if (event.shiftKey && lastSelectedChannel.value) {
    // Shift-click: select range
    const groupChannels = getGroupChannels(groupId)
    const lastIndex = groupChannels.findIndex(ch => ch.id === lastSelectedChannel.value.id)
    const currentIndex = groupChannels.findIndex(ch => ch.id === channel.id)

    if (lastIndex !== -1) {
      // Prevent default to avoid checkbox toggling
      event.preventDefault()

      // Select all channels in range
      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)

      for (let i = start; i <= end; i++) {
        groupChannels[i].selected = true
      }

      lastSelectedChannel.value = channel
      return
    }
  }

  // Normal click: toggle selection (checkbox updates naturally)
  channel.selected = !channel.selected
  lastSelectedChannel.value = channel
}

const getGroupSelectedCount = (groupId) => {
  const groupChannels = getGroupChannels(groupId)
  return groupChannels.filter(ch => ch.selected).length
}

const openBulkEdit = (groupId) => {
  bulkMoveTargetGroup.value = ''
  showBulkEditModal.value = true
}

const cancelBulkEdit = () => {
  showBulkEditModal.value = false
  bulkMoveTargetGroup.value = ''
}

const executeBulkMove = async () => {
  if (!bulkMoveTargetGroup.value) return

  try {
    const selectedChannelsList = channels.value.filter(ch => ch.selected)

    // Update all selected channels
    await Promise.all(
      selectedChannelsList.map(channel =>
        axios.put(`/api/channels/${channel.id}`, {
          custom_group_id: bulkMoveTargetGroup.value
        })
      )
    )

    // Clear selection
    channels.value.forEach(ch => ch.selected = false)
    showBulkEditModal.value = false
    bulkMoveTargetGroup.value = ''

    // Reload data
    await loadData()
    success(`Moved ${selectedChannelsList.length} channel(s) successfully`)
  } catch (error) {
    console.error('Failed to move channels:', error)
    showError('Failed to move channels')
  }
}

// Auto-expand groups with matches when searching
watch(searchQuery, (newQuery) => {
  if (newQuery) {
    // Expand all groups that have matching channels
    groups.value.forEach(group => {
      if (getGroupChannelCount(group.id) > 0) {
        expandedGroups.value.add(group.id)
      }
    })
  }
})

onMounted(() => {
  loadData()
})

// Reload data when component is re-activated from keep-alive cache
// This ensures fresh data after navigating from Import page
onActivated(() => {
  loadData()
})
</script>
