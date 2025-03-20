<template>
  <div>
    <UCard class="w-64 min-h-10"
      :ui="{ rounded: 'rounded-lg rounded-lg', header: { background: 'bg-purple-100 dark:bg-purple-900 rounded-t-lg', padding: 'py-2 px-2 sm:px-4 sm:pr-2' } }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold leading-6 text-gray-900 dark:text-white  text-ellipsis overflow-hidden">
            ML 학습
            <!-- {{ node.node.label }} -->
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="closeNode" />
        </div>
      </template>
      <div class="min-h-5">
        <UChip v-if="node.node.data.state" size="md" inset :color="getColor(node.node.data.state)">
          <UAvatar icon="i-heroicons-document-text" size="md" />
        </UChip>
      </div>
    </UCard>
    <Handle type="source" :position="Position.Bottom" />
    <Handle type="target" :position="Position.Top" />

  </div>
</template>

<script setup lang="ts">
import { useVueFlow, useNode, Position, Handle } from '@vue-flow/core';

const { removeNodes } = useVueFlow();

const node = useNode();
const nodeId = ref<string>(node.id);

const getColor = (state: string) => {
  switch (state) {
    case 'SUCCEEDED':
      return 'green'
    case 'PENDING':
      return 'amber'
    case 'RUNNING':
      return 'blue'
    case 'FAILED':
      return 'red'
    default:
      return 'gray'
  }
}

const closeNode = () => {
  if (confirm('delete?')) {
    removeNodes(node.id)
  }
}

</script>