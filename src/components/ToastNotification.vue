<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  message: string
  type?: 'success' | 'error' | 'info'
}>()

const show = ref(false)
const displayMessage = ref('')

if (props.message) {
  displayMessage.value = props.message
  show.value = true
  setTimeout(() => {
    show.value = false
  }, 3000)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed top-5 left-1/2 -translate-x-1/2 z-50"
    >
      <div :class="['alert', type === 'error' ? 'alert-error' : type === 'info' ? 'alert-info' : 'alert-success']">
        <span>{{ displayMessage }}</span>
      </div>
    </div>
  </Teleport>
</template>
