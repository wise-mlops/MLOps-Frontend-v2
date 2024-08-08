<template>
  <div>
    <UHorizontalNavigation :links="links" class="mb-4" />
  </div>
</template>

<script lang="ts" setup>
const links = defineModel<any>("links", { default: [] })

</script>

<style></style>