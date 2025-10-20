<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Edit Group</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="localGroup" class="space-y-4">
        <!-- Group Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="Enter group name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="save"
          />
        </div>

        <!-- Export Toggle -->
        <div class="flex items-center">
          <input
            v-model="formData.is_exported"
            type="checkbox"
            id="group-export-toggle"
            class="h-4 w-4 text-blue-600 rounded"
          />
          <label for="group-export-toggle" class="ml-2 text-sm text-gray-700">
            Include in export
          </label>
        </div>

        <!-- Statistics -->
        <div class="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
          <p>Created: {{ formatDate(localGroup.created_at) }}</p>
          <p v-if="channelCount !== null">Channels: {{ channelCount }}</p>
        </div>

        <!-- Delete Button -->
        <div class="pt-2 border-t">
          <button
            @click="deleteGroup"
            class="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete this group
          </button>
          <p class="text-xs text-gray-500 mt-1">
            Channels will not be deleted, only unassigned from this group
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-2 pt-4 border-t">
          <button
            @click="close"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="saving || !formData.name.trim()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  show: Boolean,
  group: Object,
  channelCount: Number
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const localGroup = ref(null)
const formData = ref({
  name: '',
  is_exported: true
})
const saving = ref(false)

watch(() => props.group, (newGroup) => {
  if (newGroup) {
    localGroup.value = { ...newGroup }
    formData.value = {
      name: newGroup.name,
      is_exported: newGroup.is_exported === 1
    }
  }
}, { immediate: true })

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const save = async () => {
  if (!localGroup.value || !formData.value.name.trim()) return

  saving.value = true
  try {
    await axios.put(`/api/groups/${localGroup.value.id}`, {
      name: formData.value.name.trim(),
      is_exported: formData.value.is_exported ? 1 : 0
    })

    emit('saved')
    close()
  } catch (error) {
    console.error('Failed to save group:', error)
    alert('Failed to save changes. Please try again.')
  } finally {
    saving.value = false
  }
}

const deleteGroup = async () => {
  if (!localGroup.value) return

  // If group has channels, show options modal
  if (props.channelCount > 0) {
    emit('delete-with-channels', localGroup.value)
    return
  }

  // Empty group - simple confirmation
  if (!confirm(`Are you sure you want to delete the group "${localGroup.value.name}"?`)) {
    return
  }

  saving.value = true
  try {
    await axios.delete(`/api/groups/${localGroup.value.id}`)
    emit('deleted')
    close()
  } catch (error) {
    console.error('Failed to delete group:', error)
    alert('Failed to delete group. Please try again.')
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('close')
}
</script>
