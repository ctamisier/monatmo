<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHomeStore } from '../stores/home.store'
import ToastNotification from './ToastNotification.vue'

const { t } = useI18n()
const home = useHomeStore()

onMounted(() => {
  home.loadHomes()
})
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('home.title') }}
      </h2>

      <div
        v-if="home.loading"
        class="text-center py-10 opacity-60"
      >
        {{ t('home.loading') }}
      </div>

      <div
        v-else-if="home.homes.length === 0"
        class="opacity-60 text-sm"
      >
        {{ t('home.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] auto-rows-[1fr] gap-4"
      >
        <div
          v-for="h in home.homes"
          :key="h.id"
          class="card-custom card-inner"
          :class="
            h.id === home.selectedHomeId
              ? 'border-[#e05297]!'
              : ''
          "
          @click="home.selectHome(h.id)"
        >
          <div class="card-body">
            <h4 class="card-title">
              {{ h.name || t('home.fallbackName') }}
            </h4>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ToastNotification
    v-if="home.error"
    :key="home.errorCount"
    :message="home.error"
    type="error"
  />
</template>
