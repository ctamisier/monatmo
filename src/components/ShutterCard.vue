<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useShutterStore } from '../stores/shutter.store'
import ShutterModuleCard from './ShutterModuleCard.vue'
import ToastNotification from './ToastNotification.vue'

const { t } = useI18n()
const shutter = useShutterStore()
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('shutter.title') }}
      </h2>

      <div
        v-if="shutter.shutterModules.length === 0 && !shutter.loading"
        class="opacity-60 text-sm"
      >
        {{ t('shutter.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] auto-rows-[1fr] gap-4"
      >
        <ShutterModuleCard
          v-for="mod in shutter.shutterModules"
          :key="mod.id"
          :module-id="mod.id"
          :name="mod.name"
          :room-name="mod.roomName"
          :type="mod.type"
          :current-position="mod.currentPosition"
          :target-position="mod.targetPosition"
          :target-position-step="mod.targetPositionStep"
        />
      </div>
    </div>
  </div>

  <ToastNotification
    v-if="shutter.statusMessage"
    :key="shutter.statusMessage"
    :message="shutter.statusMessage"
    type="success"
  />

  <ToastNotification
    v-if="shutter.error"
    :key="shutter.errorCount"
    :message="shutter.error"
    type="error"
  />
</template>
