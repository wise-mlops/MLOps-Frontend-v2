<template>
  <div class="max-h-full max-h-screen">
    <USlideover v-model="isOpen" :overlay="false" side="right" :appear="true">
      <UCard class="flex flex-col flex-1"
        :ui="{ body: { base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <!-- <h2 class="text-lg font-semibold">{{ node?.label }}</h2> -->
            <UInput v-model="nodeLabel" class="w-full border-b" variant="none" :disabled="!isEditable" />
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="my-1"
              @click="isOpen = false" />
          </div>
        </template>
        <div class="flex-1 overflow-y-auto px-2" style="height: calc(100vh - 180px);">
          <UTabs :items="tabItems">
            <template #information="{ item }">
              <div>
                <UFormGroup label="Node ID" name="node_id" class="py-2">
                  <UInput v-model="nodeId" class=" w-full" variant="none" readonly />
                </UFormGroup>
                <UFormGroup label="Node Type" name="node_type" class="py-2">
                  <UInput v-model="nodeType" class="w-full" variant="none" readonly />
                </UFormGroup>
              </div>
            </template>
            <template #settings="{ item }">
              <div class="">
                <div v-if="node?.type === 'NodeLoadData'">
                  <InfoLoadData v-model="params" :isEditable="isEditable" />
                </div>
                <div v-else-if="node?.type === 'NodeLoadPreLLM'">
                  <InfoLoadPreLlm v-model="params" :isEditable="isEditable" />
                </div>
                <div v-else-if="node?.type === 'NodeTrainMlModel'">
                  <InfoTrainMlModel v-model="params" :isEditable="isEditable" />
                </div>
                <div v-else-if="node?.type === 'NodeTrainLLMFinetune'">
                  <InfoTrainLlmFinetune />
                </div>
                <div v-else-if="node?.type === 'NodeTrainLLMPrompttune'">
                  <InfoTrainLlmPrompttune />
                </div>
                <div v-else-if="node?.type === 'NodeValMlModel'">
                  <InfoValMlModel />
                </div>
                <div v-else-if="node?.type === 'NodeValLLM'">
                  <InfoValLlm />
                </div>
                <div v-else-if="node?.type === 'NodePickMlModel'">
                  <InfoPickMlModel />
                </div>
                <div v-else-if="node?.type === 'NodeServeMlModel'">
                  <InfoServeMlModel v-model="params" :isEditable="isEditable" />
                </div>
                <div v-else>
                  <UFormGroup label=" componentType" name="component_type" class="py-2">
                    <!-- <USelectMenu v-model="componentType" :options="componentTypes" size="md" :disabled="!isEditable" /> -->
                  </UFormGroup>
                  <UFormGroup label="Params" name="params" class="py-2">
                    <div class="h-[32rem] overflow-auto">
                      <!-- <ModuleKeyValue v-model="params" :isEditable="isEditable" /> -->
                    </div>
                  </UFormGroup>
                </div>
              </div>
            </template>
          </UTabs>
        </div>
        <template v-if="isEditable" #footer>
          <div class="absolute bottom-0 left-0 w-full bg-white p-4 border-t">
            <UButton label="SAVE" @click="saveAttribute"></UButton>
          </div>
        </template>
      </UCard>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { useVueFlow, type Node } from '@vue-flow/core';
import InfoLoadData from './nodes/info-load-data.vue';
import InfoLoadPreLlm from './nodes/info-load-pre-llm.vue';
import InfoTrainMlModel from './nodes/info-train-ml-model.vue';
import InfoTrainLlmFinetune from './nodes/info-train-llm-finetune.vue';
import InfoTrainLlmPrompttune from './nodes/info-train-llm-prompttune.vue';
import InfoValMlModel from './nodes/info-val-ml-model.vue';
import InfoValLlm from './nodes/info-val-llm.vue';
import InfoPickMlModel from './nodes/info-pick-ml-model.vue';
import InfoServeMlModel from './nodes/info-serve-ml-model.vue';

const { updateNode } = useVueFlow();

const isOpen = defineModel<boolean>('isOpen')
const node = defineModel<Node>('node')
const watchOpen = ref(isOpen)


const params = ref([])
const nodeLabel = ref('')

const isEditable = defineModel('isEditable', { default: false })
const nodeId = computed(() => node.value?.id || '')
const nodeType = computed(() => node.value?.type || '')


const saveAttribute = () => {

  if (!node.value) return

  node.value.data.attribute = JSON.parse(JSON.stringify(params.value))
  node.value.label = JSON.parse(JSON.stringify(nodeLabel.value));
  console.log(node.value.data.attribute)
  alert('saved')

  watchOpen.value = false
}

onMounted(() => {

})

watch(watchOpen, () => {

  // 사이드 창이 열릴 때
  if (watchOpen.value) {

    params.value = JSON.parse(JSON.stringify(node.value?.data.attribute || []));
    nodeLabel.value = JSON.parse(JSON.stringify(node.value?.label || []));
  }

  // if (watchOpen.value && node.value) {
  //   if (node.value?.data.attribute) {
  //     // attributes.value = node.value?.data.attribute.value
  //     // params.value = node.value?.data.attribute
  //   // label.value = node.value.label

  //   // const { type, ...param } = node.value.data.attribute;
  //   // componentType.value = type;
  //   // params.value = param;
  // }
})

const tabItems = ref([
  {
    slot: 'information',
    label: 'Information'
  },
  {
    slot: 'settings',
    label: 'Settings'
  }
])

</script>