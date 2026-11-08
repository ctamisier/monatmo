<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTemperatureStore } from '../stores/temperature.store'
import { useHomeStore } from '../stores/home.store'
import ToastNotification from './ToastNotification.vue'
import RoomCard from './temperature/RoomCard.vue'
import TemperatureChart from './temperature/TemperatureChart.vue'
import type { ChartScale, TemperatureValve } from '../types/temperature'

type RoomCardModel = {
  id: string
  name: string
  isThermostat: boolean
  selected: boolean
  measuredTemperature?: number
  setpointTemperature?: number
  valves: TemperatureValve[]
}

const { t } = useI18n()
const tempStore = useTemperatureStore()
const homeStore = useHomeStore()

const roomCards = computed<RoomCardModel[]>(() => tempStore.displayRooms.map((room) => {
  const roomStatus = homeStore.homeStatus?.rooms?.find((candidate) => candidate.id === room.id)

  return {
    id: room.id,
    name: room.name || t('temperature.fallbackRoom', { id: room.id }),
    isThermostat: tempStore.thermostatRoomIds.has(room.id),
    selected: tempStore.selectedRoomIds.includes(room.id),
    measuredTemperature: roomStatus?.therm_measured_temperature,
    setpointTemperature: roomStatus?.therm_setpoint_temperature,
    valves: tempStore.getValveModulesForRoom(room.id),
  }
}))

const hasThermostat = computed(() => tempStore.thermostatRoomIds.size > 0)

let currentHomeId: string | null = null

// Les données sont rafraîchies à chaque mise à jour du statut, mais le zoom de
// l'utilisateur n'est réinitialisé que lorsqu'on change réellement de maison.
watch(() => homeStore.homeStatus, () => {
  const homeId = homeStore.selectedHomeId
  if (homeId !== currentHomeId) {
    currentHomeId = homeId
    tempStore.reset()
  }
  void tempStore.refreshChartData()
}, { immediate: true })

function onToggleRoom(roomId: string): void {
  void tempStore.toggleRoomSelection(roomId)
}

function onTemperatureChange(roomId: string, delta: number): void {
  void tempStore.changeRoomTemperature(roomId, delta)
}

function onSelectScale(scale: ChartScale): void {
  void tempStore.setScale(scale)
}

function onZoom(startMs: number, endMs: number): void {
  void tempStore.zoomToDateRange(startMs, endMs)
}

function onResetZoom(): void {
  void tempStore.resetZoom()
}
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('temperature.title') }}
      </h2>

      <div
        v-if="tempStore.displayRooms.length === 0 && !tempStore.loading"
        class="opacity-60 text-base"
      >
        {{ t('temperature.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] auto-rows-[1fr] gap-4"
      >
        <RoomCard
          v-for="room in roomCards"
          :key="room.id"
          :name="room.name"
          :is-thermostat="room.isThermostat"
          :selected="room.selected"
          :measured-temperature="room.measuredTemperature"
          :setpoint-temperature="room.setpointTemperature"
          :valves="room.valves"
          @toggle="onToggleRoom(room.id)"
          @change-temperature="onTemperatureChange(room.id, $event)"
        />
      </div>

      <div
        v-if="hasThermostat"
        class="mt-6"
      >
        <TemperatureChart
          :datasets="tempStore.chartDatasets"
          :date-begin="tempStore.dateBegin"
          :date-end="tempStore.dateEnd"
          :selected-scale="tempStore.selectedScale"
          :available-scales="tempStore.availableScales"
          :loading="tempStore.loading"
          @select-scale="onSelectScale"
          @zoom="onZoom"
          @reset="onResetZoom"
        />
      </div>
    </div>
  </div>

  <ToastNotification
    v-if="tempStore.error"
    :key="tempStore.errorCount"
    :message="tempStore.error"
    type="error"
  />
</template>
