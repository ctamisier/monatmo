<script setup lang="ts">
defineProps<{ class?: string; width?: number; height?: number }>()
</script>

<template>
  <svg
    :width="width ?? 20"
    :height="height ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="$props.class"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
</template>
