<template>
  <!--VueFlow-->
  <div class="w-full h-full grow" id="main-canvas">
    <VueFlow :nodes="pipeline ? pipeline.nodes : nodes" :edges="pipeline ? pipeline.edges : edges"
      :nodeTypes="nodeTypes">
      <Panel v-if="isEditable" position="top-left" v-show="true">
        <UDropdown :items="pannelItems" :popper="{ placement: 'bottom-start' }">
          <UButton label="Action" trailing-icon="i-heroicons-chevron-down-20-solid" />
        </UDropdown>
      </Panel>
      <Controls>
      </Controls>
      <Background />
      <MiniMap />
    </VueFlow>
    <WorkflowNodeInfo v-model:isOpen="isSideOpen" v-model:node="currentNode" :isEditable="isEditable" />
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

const pipeline = defineModel();
const isEditable = defineModel('isEditable', { default: false });

const nodeTypes = ref<any>({
  'CustomNode': markRaw(CustomNode)
})

const nodeAttrbute = ref({
  type: '',
  model_name: ''
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

  params.sourceHandle = "__handle-" + Position.Left
  params.targetHandle = "__handle-" + Position.Right
  params.data = {
    text: 'test'
  }
  params.markerEnd = 'arrowclosed'
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
      attribute: {

      },
      toolbar: {
        position: 'right'
      }

    }
  })

  addNodes(newNode.value)
}

const removeAll = () => {
  removeNodes(nodes.value);
}


onMounted(() => {

})

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