<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type Props = {
  title?: string
  description?: string
}

const { t } = useI18n()

withDefaults(defineProps<Props>(), {
  title: t('common.card'),
  description: '',
})
</script>

<template>
  <div class="card bg-base-200/90 border border-base-300 shadow-xl backdrop-blur-sm">
    <div class="card-body">
      <h2 class="card-title">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-base-content/70 text-sm"
      >
        {{ description }}
      </p>
      <slot />
    </div>
  </div>
</template>
