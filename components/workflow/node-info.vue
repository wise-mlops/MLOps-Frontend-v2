<template>
  <div class="max-h-full max-h-screen">
    <USlideover v-model="isOpen" :overlay="false" side="right" :appear="true">
      <UCard class="flex flex-col flex-1"
        :ui="{ body: { base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <UInput v-model="label" class="w-full border-b" variant="none"></UInput>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="my-1"
              @click="isOpen = false" />
          </div>
        </template>
        <UTabs :items="tabItems">
          <template #information="{ item }">
            <UFormGroup label="Node ID" name="node_id" class="py-2">
              <UInput :v-model="node?.id || ''" class="w-full" variant="none" readonly />
            </UFormGroup>
            <UFormGroup label="Node Type" name="node_type" class="py-2">
              <UInput :v-model="node?.type || ''" class="w-full" variant="none" readonly />
            </UFormGroup>
          </template>
          <template #settings="{ item }">
            {{ node?.type }}
            <div v-if="node?.type === 'NodeLoadData'">
              <InfoLoadData />
            </div>
            <div v-else-if="node?.type === 'NodeLoadPreLLM'">
              <InfoLoadPreLlm />
            </div>
            <div v-else-if="node?.type === 'NodeTrainMlModel'">
              <InfoTrainMlModel />
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
              <InfoServeMlModel />
            </div>
            <div v-else>
              <UFormGroup label="componentType" name="component_type" class="py-2">
                <USelectMenu v-model="componentType" :options="componentTypes" size="md" :disabled="!isEditable" />
              </UFormGroup>
              <UFormGroup label="Params" name="params" class="py-2">
                <div class="h-[32rem] overflow-auto">
                  <ModuleKeyValue v-model="params" :isEditable="isEditable" />
                </div>
              </UFormGroup>
            </div>
          </template>
        </UTabs>
        <template v-if="isEditable" #footer>
          <div>
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
const label = ref('')
const componentType = ref('')
const params = ref([])
const isEditable = defineModel('isEditable', { default: false })



const saveAttribute = () => {

  node.value.label = label.value
  let attribute = {
    type: componentType.value,
    ...params.value
  }

  node.value.data.attribute = { ...attribute }
  alert('saved')
}


const componentTypes = ref([]);

const getComponentTypes = async () => {
  const response = await getPipelineComponentTypes()
  componentTypes.value = response.result ? response.result : []

}

onMounted(() => {
  getComponentTypes();
})

watch(watchOpen, () => {

  if (watchOpen.value) {
    label.value = node.value.label
    const { type, ...param } = node.value.data.attribute;
    componentType.value = type;
    params.value = param;
  }
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

function defineProps<T>() {
  throw new Error('Function not implemented.');
}
</script>