<template>
  <!--VueFlow-->
  <div class="h-full " id="main-canvas">
    <VueFlow :nodes="nodes" :edges="edges" :nodeTypes="nodeTypes">
      <Panel position="top-left" v-show="true">
        <UDropdown :items="pannelItems" :popper="{ placement: 'bottom-start' }">
          <UButton label="Action" trailing-icon="i-heroicons-chevron-down-20-solid" />
        </UDropdown>
      </Panel>
      <Controls>
      </Controls>
      <Background />
      <MiniMap />
    </VueFlow>
    <WorkflowNodeInfo v-model:isOpen="isSideOpen" v-model:node="currentNode" />
  </div>
</template>

<script setup lang="ts">
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { Panel, useVueFlow, VueFlow, Position, type Node, type Edge, type Connection, type EdgeMouseEvent, type NodeMouseEvent } from '@vue-flow/core';
import CustomNode from './nodes/custom-node.vue';

const { nodes, edges, addNodes, removeNodes, dimensions, onNodeClick, onConnect, onEdgeClick, addEdges } = useVueFlow();


const isSideOpen = ref(false);
const currentNode = ref<Node>();
const currentEdge = ref<Edge>();

const nodeTypes = ref<any>({
  'CustomNode': markRaw(CustomNode)

})

onNodeClick((event: NodeMouseEvent) => {
  isSideOpen.value = true;
  currentNode.value = event.node;

})

onEdgeClick((event: EdgeMouseEvent) => {
  currentEdge.value = event.edge
})

onConnect((params: Connection) => {
  const source = params.source;
  const target = params.target;
  if (source == target) {
    console.log('Can not connect itselft')
    return;
  }
  addEdges(params)
})

const onAddNode = () => {
  const newId = crypto.randomUUID().replaceAll('-', '');
  const newNode = ref<Node>({
    id: newId,
    type: 'CustomNode',
    label: newId,
    position: {
      x: (Math.random() * dimensions.value.width) / 3,
      y: (Math.random() * dimensions.value.height) / 3
    },
    data: {
      attributes: {

      }
    }
  })

  addNodes(newNode.value)
}

const removeAll = () => {
  removeNodes(nodes.value);
}

const pannelItems = ref([
  [
    {
      label: 'Add Operation Node',
      icon: 'i-heroicons-play',
      click: onAddNode
    },
    {
      label: 'Add Condition Node',
      icon: 'i-heroicons-arrows-right-left',
      click: onAddNode
    }
  ],
  [
    {
      label: 'Clear All Nodes',
      icon: 'i-heroicons-trash',
      click: removeAll
    }
  ]
])
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
</style>