<template>
  <div class="p-4">
    <UBreadcrumb :links="links" />
  </div>
</template>

<script lang="ts" setup>
const links = defineModel<any>("breadcrumbs", { default: [] })
</script>

<style></style>