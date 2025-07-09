<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs :items="tabItems"
      :ui="{ container: 'relative w-full grow', list: { width: 'w-96' }, base: 'focus:outline-none h-full' }"
      class="grow flex flex-col">
      <template #info="{ item }">
        <div>
          <ModuleLabelValue v-model="attribute" />
        </div>
      </template>
      <template #prediction="{ item }">
        <div class="h-screen p-4">
          <ModulePredict
            :exp-key="expKey"
            :default-input="defaultInputData || {}"
            :model-type="modelType"
            :inputs="inputColumns"
          />
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute()

const attribute = ref([
  {
    id: 'exp_key',
    label: 'Experiment Key',
    value: ''
  },
  {
    id: 'status',
    label: 'Status',
    value: ''
  },
  {
    id: 'model_type',
    label: 'Model Type',
    value: ''
  },
  {
    id: 'algorithm',
    label: 'Algorithm',
    value: ''
  },
  {
    id: 'val_acc',
    label: 'Accuracy',
    value: ''
  },
  {
    id: 'created_at',
    label: 'Created at',
    value: ''
  }
])

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Simple ML',
    to: '/simple-ml/'
  },
  {
    label: 'Details',
  },
])

const pageTitle = ref('Simple ML Model details')
const expKey = ref(route.params.id)
const simpleMLModelDetails = ref()
const defaultInputData = ref([]);
const modelType = ref('');
const inputColumns = ref([]);

// Provide로 함수 제공
provide('predictFunction', predictSimpleMLModel);

function flattenWithAutoJsonConversion(obj: any) {
  const { training_config, ...otherData } = obj;
  const flattened = { ...otherData };
  if (training_config) {
    for (const key in training_config) {
      if (training_config.hasOwnProperty(key)) {
        const value = training_config[key];
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          flattened[key] = JSON.stringify(value, null, 2);
        } else {
          flattened[key] = value;
        }
      }
    }
  }
  return flattened;
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

const loadSimpleMLModelDetails = async () => {
  try {
    const response = await getSimpleMLModelDetails(expKey.value);
    simpleMLModelDetails.value = response.result;

    // Extract model type
    modelType.value = simpleMLModelDetails.value.model_type || '';

    // Extract inputs from training_config (tabular 모델의 경우에만)
    if (simpleMLModelDetails.value.training_config?.inputs) {
      inputColumns.value = simpleMLModelDetails.value.training_config.inputs;
    }

    const flattenedData = flattenWithAutoJsonConversion(simpleMLModelDetails.value);

    attribute.value = attribute.value.map((item: any) => ({
      ...item,
      value: flattenedData[item.id] !== undefined ? flattenedData[item.id] : item.value
    }));

    if (simpleMLModelDetails.value.training_config) {
      const trainingConfigKeys = Object.keys(simpleMLModelDetails.value.training_config);
      trainingConfigKeys.forEach(key => {
        if (!attribute.value.find((item: any) => item.id === key)) {
          attribute.value.push({
            id: key,
            label: formatLabel(key),
            value: flattenedData[key] || ''
          });
        }
      });
    }
  } catch (error) {
    console.error('Error loading model details:', error);
  }
}

onBeforeMount(() => {
  loadSimpleMLModelDetails()
})

const toolbarLinks = ref([
  [
    {
      label: '취소',
      icon: 'i-heroicons-arrow-uturn-left',
      click: () => { router.back() }
    }
  ],
  []
])

const tabItems = ref([
  {
    slot: 'info',
    label: 'Information'
  },
  {
    slot: 'prediction',
    label: 'Prediction'
  }
])
</script>