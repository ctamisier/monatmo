<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    :class="$props.class"
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
  </svg>
</template>
