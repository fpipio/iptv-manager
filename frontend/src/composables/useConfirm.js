import { ref } from 'vue'

const dialogs = ref([])
let idCounter = 0

export function useConfirm() {
  const showConfirm = ({ title, message, confirmText, cancelText, type = 'warning' }) => {
    return new Promise((resolve) => {
      const id = idCounter++
      const dialog = {
        id,
        title,
        message,
        confirmText: confirmText || 'Confirm',
        cancelText: cancelText || 'Cancel',
        type,
        onConfirm: () => {
          removeDialog(id)
          resolve(true)
        },
        onCancel: () => {
          removeDialog(id)
          resolve(false)
        }
      }
      dialogs.value.push(dialog)
    })
  }

  const removeDialog = (id) => {
    const index = dialogs.value.findIndex(d => d.id === id)
    if (index !== -1) {
      dialogs.value.splice(index, 1)
    }
  }

  return {
    dialogs,
    showConfirm,
    removeDialog
  }
}
