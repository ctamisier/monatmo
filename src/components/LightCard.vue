<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLightStore } from '../stores/light.store'
import ToastNotification from './ToastNotification.vue'

const { t } = useI18n()
const light = useLightStore()

function onToggle(moduleId: string, isOn: boolean) {
  light.controlLight(moduleId, isOn)
}
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('light.title') }}
      </h2>

      <div
        v-if="light.lightModules.length === 0 && !light.loading"
        class="opacity-60 text-sm"
      >
        {{ t('light.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] auto-rows-[1fr] gap-4"
      >
        <div
          v-for="mod in light.lightModules"
          :key="mod.id"
          class="card-custom card-inner cursor-default! hover:border-[rgba(123,94,167,0.15)]! hover:shadow-none!"
          :class="
            mod.isOn
              ? 'light-on'
              : ''
          "
        >
          <div class="card-body">
            <h4
              class="card-title transition-colors duration-300"
              :class="{ 'light-title-on': mod.isOn }"
            >
              {{ mod.name || t('light.fallbackName', { id: mod.id.substring(0, 8) }) }}
            </h4>
            <div class="text-base font-medium opacity-75 mb-3">
              {{ mod.roomName || t('shutter.unknownRoom') }}
            </div>

            <div class="flex items-center justify-between">
              <span
                class="text-sm font-bold transition-all duration-300"
                :class="mod.isOn ? 'text-[#f0c040] light-label-on' : 'opacity-50'"
              >
                {{ mod.isOn ? t('light.on') : t('light.off') }}
              </span>
              <input
                type="checkbox"
                class="toggle toggle-md"
                :class="mod.isOn ? 'toggle-success' : ''"
                :checked="mod.isOn"
                :disabled="!mod.controllable || light.pendingId === mod.id"
                @change="onToggle(mod.id, !mod.isOn)"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ToastNotification
    v-if="light.error"
    :key="light.errorCount"
    :message="light.error"
    type="error"
  />
</template>

<style scoped>
.light-on {
  background: radial-gradient(ellipse 120% 80% at 50% 30%, rgba(240, 192, 64, 0.10) 0%, rgba(244, 132, 95, 0.05) 40%, rgba(10, 8, 20, 0.97) 80%) !important;
  box-shadow: 0 0 30px rgba(240, 192, 64, 0.15) !important;
}

.light-on:hover {
  background: radial-gradient(ellipse 120% 80% at 50% 30%, rgba(240, 192, 64, 0.12) 0%, rgba(244, 132, 95, 0.06) 40%, rgba(10, 8, 20, 0.97) 80%) !important;
  box-shadow: 0 0 30px rgba(240, 192, 64, 0.2) !important;
}

.light-title-on {
  color: #f0c040;
  text-shadow: 0 0 12px rgba(240, 192, 64, 0.4);
}

.light-label-on {
  text-shadow: 0 0 8px rgba(240, 192, 64, 0.35);
}
</style>
