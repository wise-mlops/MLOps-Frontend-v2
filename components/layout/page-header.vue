<template>
  <div class="w-full px-4">
    <h2 class="mb-4 text-3xl font-extrabold leading-none tracking-tight text-gray-900 md:text-4xl dark:text-white">
      {{ title }}
    </h2>

  </div>
</template>

<script setup lang="ts">
const title = defineModel<string>("title", { default: 'Page Title' })
</script>