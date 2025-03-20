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


import NodeLoadData from './nodes/node-load-data.vue'
import NodeLoadPreLLM from './nodes/node-load-pre-llm.vue'
import NodeTrainMlModel from './nodes/node-train-ml-model.vue'
import NodeTrainLLMFinetune from './nodes/node-train-llm-finetune.vue'
import NodeTrainLLMPrompttune from './nodes/node-train-llm-prompttune.vue'
import NodeValMlModel from './nodes/node-val-ml-model.vue'
import NodeValLLM from './nodes/node-val-llm.vue'
import NodePickMlModel from './nodes/node-pick-ml-model.vue'
import NodeServeMlModel from './nodes/node-serve-ml-model.vue'

const { nodes, edges, addNodes, removeNodes, dimensions, onNodeClick, onConnect, onEdgeClick, addEdges } = useVueFlow();


const isSideOpen = ref(false);
const currentNode = ref<Node>();
const currentEdge = ref<Edge>();


const pipeline = defineModel();
const isEditable = defineModel('isEditable', { default: false });

const nodeTypes = ref<any>({
  'CustomNode': markRaw(CustomNode),
  'NodeLoadData': markRaw(NodeLoadData),
  'NodeLoadPreLLM': markRaw(NodeLoadPreLLM),
  'NodeTrainMlModel': markRaw(NodeTrainMlModel),
  'NodeTrainLLMFinetune': markRaw(NodeTrainLLMFinetune),
  'NodeTrainLLMPrompttune': markRaw(NodeTrainLLMPrompttune),
  'NodeValMlModel': markRaw(NodeValMlModel),
  'NodeValLLM': markRaw(NodeValLLM),
  'NodePickMlModel': markRaw(NodePickMlModel),
  'NodeServeMlModel': markRaw(NodeServeMlModel)
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
  // params.data = {
  //   text: 'test'
  // }
  // params.markerEnd = 'arrowclosed'
  addEdges(params)
})

const onAddNode = (nodeType: string) => {
  const newId = crypto.randomUUID().replaceAll('-', '');

  const newNode = ref<Node>({
    id: newId,
    type: nodeType,
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
      label: '데이터 로딩',
      icon: 'i-heroicons-circle-stack',
      click: () => { onAddNode('NodeLoadData') }
    },
    {
      label: '사전학습 모델 불러오기',
      icon: 'i-heroicons-circle-stack',
      click: () => { onAddNode('NodeLoadPreLLM') }
    },
  ],
  [
    {
      label: 'ML 학습',
      icon: 'i-heroicons-rocket-launch',
      click: () => { onAddNode('NodeTrainMlModel') }
    },
    {
      label: 'LLM 파인튜닝',
      icon: 'i-heroicons-rocket-launch',
      click: () => { onAddNode('NodeTrainLLMFinetune') }
    },
    {
      label: 'LLM 프롬프트 튜닝',
      icon: 'i-heroicons-rocket-launch',
      click: () => { onAddNode('NodeTrainLLMPrompttune') }
    },
  ],
  [
    {
      label: 'ML모델 평가',
      icon: 'i-heroicons-chart-bar-square',
      click: () => { onAddNode('NodeValMlModel') }
    },
    {
      label: 'LLM모델 평가',
      icon: 'i-heroicons-chart-bar-square',
      click: () => { onAddNode('NodeValLLM') }
    },
  ],
  [
    {
      label: 'ML 최적 모델 선택',
      icon: 'i-heroicons-numbered-list',
      click: () => { onAddNode('NodePickMlModel') }
    },
  ],
  [
    {
      label: '모델 서빙',
      icon: 'i-heroicons-play-circle',
      click: () => { onAddNode('NodeServeMlModel') }
    },
  ],
  [
    {
      label: 'Clear All Nodes',
      icon: 'i-heroicons-trash',
      click: () => { removeAll() }
    }
  ]
])
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
</style>