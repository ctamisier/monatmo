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
    stroke-width="1.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="$props.class"
  >
    <path d="M1 4v6h6" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
</template>
