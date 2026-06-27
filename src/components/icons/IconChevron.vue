<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <svg
    viewBox="0 0 12 12"
    fill="none"
    :class="$props.class"
  >
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
