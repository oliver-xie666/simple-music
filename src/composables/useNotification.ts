import { ref, computed } from 'vue'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

const notification = ref<{
  message: string
  type: NotificationType
  show: boolean
}>({
  message: '',
  type: 'info',
  show: false
})

export function useNotification() {
  function show(message: string, type: NotificationType = 'info') {
    notification.value.message = message
    notification.value.type = type
    notification.value.show = true
    setTimeout(() => {
      notification.value.show = false
    }, 3000)
  }

  return {
    notification: computed(() => notification.value),
    show,
  }
}

