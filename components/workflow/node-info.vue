<template>
  <div>
    <USlideover v-model="isOpen" :overlay="false" side="right" :appear="true">
      <UCard class="flex flex-col flex-1"
        :ui="{ body: { base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <UInput v-model="node.label" class="w-full border-b" variant="none"></UInput>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="my-1"
              @click="isOpen = false" />
          </div>
        </template>
        <UTabs :items="tabItems">
          <template #tab1="{ item }">
            Tab1
          </template>
          <template #tab2="{ item }">
            Tab2
          </template>

        </UTabs>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { type Node } from '@vue-flow/core';


const isOpen = defineModel<boolean>('isOpen')
const node = defineModel<Node>('node')


const tabItems = ref([
  {
    slot: 'tab1',
    label: 'Tab1'
  },
  {
    slot: 'tab2',
    label: 'tab2'
  }
])
</script>