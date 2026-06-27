<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  open: boolean
  title?: string
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <dialog
      class="modal"
      :class="{ 'modal-open': open }"
    >
      <div class="modal-box card-custom">
        <div class="card-body">
          <h3
            v-if="title"
            class="card-title"
          >
            {{ title }}
          </h3>
          <p class="py-4">
            {{ message }}
          </p>
          <div class="card-actions justify-end">
            <button
              class="btn-nebula-ghost"
              @click="emit('cancel')"
            >
              {{ t('dialog.cancel') }}
            </button>
            <button
              class="btn-stop"
              @click="emit('confirm')"
            >
              {{ t('dialog.confirm') }}
            </button>
          </div>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button @click="emit('cancel')">
          {{ t('dialog.cancel') }}
        </button>
      </form>
    </dialog>
  </Teleport>
</template>
