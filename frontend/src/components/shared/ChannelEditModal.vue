<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg p-4 sm:p-6 max-w-full sm:max-w-lg md:max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Edit Channel</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="localChannel" class="space-y-4">
        <!-- Channel ID (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Channel ID</label>
          <input
            :value="localChannel.tvg_id"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>

        <!-- Channel Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Channel Name
            <span v-if="localChannel.is_name_overridden" class="text-xs text-blue-600 ml-1">(customized)</span>
          </label>
          <input
            v-model="formData.custom_tvg_name"
            type="text"
            placeholder="Enter custom name or leave empty for original"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Original: {{ localChannel.imported_tvg_name }}
          </p>
        </div>

        <!-- Channel Logo URL -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
            <span v-if="localChannel.is_logo_overridden" class="text-xs text-blue-600 ml-1">(customized)</span>
          </label>
          <input
            v-model="formData.custom_tvg_logo"
            type="url"
            placeholder="Enter custom logo URL or leave empty for original"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Original: {{ localChannel.imported_tvg_logo || 'None' }}
          </p>
          <!-- Logo Preview -->
          <div v-if="formData.custom_tvg_logo || localChannel.imported_tvg_logo" class="mt-2">
            <img
              :src="formData.custom_tvg_logo || localChannel.imported_tvg_logo"
              alt="Logo preview"
              class="h-12 object-contain"
              @error="handleImageError"
            />
          </div>
        </div>

        <!-- Group Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group</label>
          <select
            v-model="formData.custom_group_id"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-1">
            Original group: {{ localChannel.imported_group_title }}
          </p>
        </div>

        <!-- Export Toggle -->
        <div class="flex items-center">
          <input
            v-model="formData.is_exported"
            type="checkbox"
            id="export-toggle"
            class="h-4 w-4 text-blue-600 rounded"
          />
          <label for="export-toggle" class="ml-2 text-sm text-gray-700">
            Include in export
          </label>
        </div>

        <!-- Stream URL (read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Stream URL</label>
          <input
            :value="localChannel.imported_url"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
          />
        </div>

        <!-- Reset Button -->
        <div v-if="hasCustomizations" class="pt-2 border-t">
          <button
            @click="resetCustomizations"
            class="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Reset all customizations to original values
          </button>
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
            :disabled="saving"
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
import { ref, watch, computed } from 'vue'
import axios from 'axios'

const props = defineProps({
  show: Boolean,
  channel: Object,
  groups: Array
})

const emit = defineEmits(['close', 'saved'])

const localChannel = ref(null)
const formData = ref({
  custom_tvg_name: '',
  custom_tvg_logo: '',
  custom_group_id: '',
  is_exported: true
})
const saving = ref(false)

const hasCustomizations = computed(() => {
  return localChannel.value &&
    (localChannel.value.is_name_overridden ||
     localChannel.value.is_logo_overridden ||
     localChannel.value.is_group_overridden)
})

watch(() => props.channel, (newChannel) => {
  if (newChannel) {
    localChannel.value = { ...newChannel }
    formData.value = {
      custom_tvg_name: newChannel.custom_tvg_name || '',
      custom_tvg_logo: newChannel.custom_tvg_logo || '',
      custom_group_id: newChannel.custom_group_id || '',
      is_exported: newChannel.is_exported === 1
    }
  }
}, { immediate: true })

const handleImageError = (e) => {
  e.target.style.display = 'none'
}

const resetCustomizations = () => {
  if (confirm('Are you sure you want to reset all customizations? This will restore the original values from the last import.')) {
    formData.value.custom_tvg_name = ''
    formData.value.custom_tvg_logo = ''
    // Keep the current group unless you want to reset it too
  }
}

const save = async () => {
  if (!localChannel.value) return

  saving.value = true
  try {
    await axios.put(`/api/channels/${localChannel.value.id}`, {
      custom_tvg_name: formData.value.custom_tvg_name || null,
      custom_tvg_logo: formData.value.custom_tvg_logo || null,
      custom_group_id: formData.value.custom_group_id,
      is_exported: formData.value.is_exported ? 1 : 0
    })

    emit('saved')
    close()
  } catch (error) {
    console.error('Failed to save channel:', error)
    alert('Failed to save changes. Please try again.')
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('close')
}
</script>
