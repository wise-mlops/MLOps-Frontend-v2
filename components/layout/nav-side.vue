<template>
  <aside id="logo-sidebar"
    class="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
    aria-label="Sidebar">
    <div class="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
      <UVerticalNavigation :links="links" :ui="{ padding: 'py-3', size: 'text-sm' }" />
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const links = [
  {
    label: 'HOME',
    icon: 'i-heroicons-home',
    to: '/'
  },
  {
    label: 'EXPERIMENTS',
    icon: 'i-heroicons-beaker',
    to: `/experiments`
  },
  {
    label: 'PIPELINES',
    icon: 'i-heroicons-square-3-stack-3d',
    to: '/pipelines'
  },
  {
    label: 'RUNS',
    icon: 'i-heroicons-play',
    to: '/runs'
  },
  {
    label: 'NOTEBOOKS',
    icon: 'i-heroicons-document-text',
    to: '/notebooks'
  }
  // {
  //   label: 'ENDPOINTS',
  //   icon: 'i-heroicons-share',
  //   to: '/notebooks'
  // }
]
</script>
