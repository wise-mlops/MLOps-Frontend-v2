<template>
  <div>
    <UCard class="w-64 min-h-10" :ui="{ header: { padding: 'py-2 px-2 sm:px-4 sm:pr-2' } }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white  text-ellipsis overflow-hidden">
            {{ node.node.label }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="closeNode" />
        </div>
      </template>
      <div>
      </div>
    </UCard>
    <Handle type="source" :position="Position.Right" />
    <Handle type="target" :position="Position.Left" />

  </div>
</template>

<script setup lang="ts">
import { useVueFlow, useNode, Position, Handle } from '@vue-flow/core';

const { removeNodes } = useVueFlow();

const node = useNode();
const nodeId = ref<string>(node.id);


const closeNode = () => {
  if (confirm('delete?')) {
    removeNodes(node.id)
  }
}

</script>