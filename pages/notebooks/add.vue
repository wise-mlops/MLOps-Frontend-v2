<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <div class="flex flex-wrap">
      <UCard class="min-h-10 mb-2 mx-2 w-full sm:w-2/5"
        :ui="{ header: { padding: 'px-4 py-2 sm:py-2' }, body: { padding: 'px-4 py-2 sm:py-2' } }">
        <template #header>
          <div class="font-bold">Information</div>
        </template>
        <div>
          <UFormGroup label="Notebook Name" name="notebook_name" class="py-2">
            <UInput v-model="notebook.name" placeholder="Input Name" variant="outline" size="md" autocomplete="off" />
          </UFormGroup>
          <UFormGroup label="Notebok Image" name="notebook_name" class="py-2">
            <USelectMenu v-model="notebook.notebookImage" :options="images" option-attribute="label"
              value-attribute="value" size="md">
            </USelectMenu>
          </UFormGroup>
        </div>
      </UCard>
      <UCard class="min-h-10 mb-2 mx-2 w-full sm:w-2/5 "
        :ui="{ header: { padding: 'px-4 py-2 sm:py-2' }, body: { padding: 'px-4 py-2 sm:py-2' } }">
        <template #header>
          <div class="font-bold">CPU/Memory</div>
        </template>
        <div class="flex">
          <div class="w-1/2 sm:w-1/2">
            <UFormGroup label="Minimum CPU" name="minCpu" class="py-2">
              <UInput type="number" v-model="notebook.minCpu" placeholder="Minimum CPU" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
            <UFormGroup label="Maximum CPU" name="maxCpu" class="py-2">
              <UInput type="number" v-model="notebook.maxCpu" placeholder="Maximum CPU" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
          </div>
          <div class="w-1/2 sm:w-1/2 mx-2">
            <UFormGroup label="Minimum Memory" name="minMemory" class="py-2">
              <UInput type="number" v-model="notebook.minMemory" placeholder="Minimum Memory" variant="outline"
                size="md" autocomplete="off" />
            </UFormGroup>
            <UFormGroup label="Maximum Memory" name="maxMemory" class="py-2">
              <UInput type="number" v-model="notebook.maxMemory" placeholder="Maximum Memory" variant="outline"
                size="md" autocomplete="off" />
            </UFormGroup>
          </div>
        </div>
      </UCard>
      <UCard class="min-h-10 mb-2 mx-2 w-full sm:w-2/5"
        :ui="{ header: { padding: 'px-4 py-2 sm:py-2' }, body: { padding: 'px-4 py-2 sm:py-2' } }">
        <template #header>
          <div class="font-bold">GPU</div>
        </template>
        <div class="flex">
          <div class="w-1/2 sm:w-1/2">
            <UFormGroup label="Number of GPUs" name="numGpu" class="py-2">
              <USelectMenu v-model="notebook.numGpu" :options="numGpus" option-attribute="label" value-attribute="value"
                size="md" />
            </UFormGroup>
          </div>
          <div class="w-1/2 sm:w-1/2 mx-2">
            <UFormGroup label="GPU Vendor" name="gpuVendor" class="py-2">
              <USelectMenu v-model="notebook.gpuVendor" :options="gpuVendors" option-attribute="label"
                value-attribute="value" size="md" />
            </UFormGroup>
          </div>
        </div>
      </UCard>
      <UCard class="min-h-10 mb-2 mx-2 w-full sm:w-2/5"
        :ui="{ header: { padding: 'px-4 py-2 sm:py-2' }, body: { padding: 'px-4 py-2 sm:py-2' } }">
        <template #header>
          <div class="font-bold">Workspace Volume</div>
        </template>
        <div>
          <div class="w-full">
            <UFormGroup label="Volume Name" name="volumeName" class="py-2">
              <UInput v-model="notebook.volumeName" placeholder="Volume Name" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
          </div>
          <div class="">
            <UFormGroup label="Size in Gi" name="volumeSize" class="py-2">
              <UInput type="number" v-model="notebook.volumeSize" placeholder="Size in Gi" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
            <URadioGroup v-model="notebook.accessMode" legend="Access mode" :options="accessModes" class="py-2" />
            <UFormGroup label="Mounth Path" name="mountPath" class="py-2">
              <UInput v-model="notebook.mountPath" placeholder="Mount Path" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>


<script setup lang="ts">

const router = useRouter();

const notebook = ref({
  name: '',
  description: '',
  notebookImage: '',
  customImage: false,
  minCpu: 1,
  maxCpu: 1.2,
  minMemory: 1,
  maxMemory: 1.2,
  numGpu: 0,
  gpuVendor: '',
  volumeName: '',
  volumeSize: 10,
  useDefaultStorageClass: true,
  accessMode: 'readwriteonce',
  mountPath: '/home/workspace',
})

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Notebooks',
    to: '/notebooks/'
  },
  {
    label: 'Add',
  },
])
const pageTitle = ref('Add Notebook')

const images = ref([
  {
    label: 'jupyter-scipy:v1.8.0-rc.2',
    value: 'kubeflownotebookswg/jupyter-scipy:v1.8.0-rc.2'
  },
  {
    label: 'jupyter-pytorch-full:v1.8.0-rc.2',
    value: 'kubeflownotebookswg/jupyter-pytorch-full:v1.8.0-rc.2'
  },
  {
    label: 'jupyter-pytorch-cuda-full:v1.8.0-rc.2',
    value: 'kubeflownotebookswg/jupyter-pytorch-cuda-full:v1.8.0-rc.2'
  },
  {
    label: 'jupyter-tensorflow-full:v1.8.0-rc.2',
    value: 'kubeflownotebookswg/jupyter-tensorflow-full:v1.8.0-rc.2'
  },
  {
    label: 'jupyter-tensorflow-cuda-full:v1.8.0-rc.2',
    value: 'kubeflownotebookswg/jupyter-tensorflow-cuda-full:v1.8.0-rc.2'
  },
  {
    label: 'jupyter-pytorch:v1.8.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api/pytorch:1.8.0'
  },
  {
    label: 'jupyter-scikit-learn:v1.8.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api/keras:1.8.0'
  },
  {
    label: 'jupyter-tensorflow:v1.8.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api/tensorflow:1.8.0'
  },
  {
    label: 'jupyter-keras:v1.8.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api/keras:1.8.0'
  },
  {
    label: 'jupyter-mxnet:1.9.1',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api/mxnet:1.9.1'
  }
])

const numGpus = ref([
  { label: '0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '8', value: 8 },
])

const gpuVendors = ref([
  {
    label: 'NVIDIA',
    value: 'nvidia'
  },
  {
    label: 'AMD',
    value: 'amd'
  }
])

const accessModes = ref([
  {
    label: 'ReadWriteOnce',
    value: 'readwriteonce'
  },
  {
    label: 'ReadOnlyMany',
    value: 'readonlymany'
  },
  {
    label: 'ReadWriteMany',
    value: 'readwritemany'
  }
])


const createNotebook = async () => [
  console.log(notebook)
]

// toolbar links  
const toolbarLinks = ref([
  [
    {
      label: '취소',
      icon: 'i-heroicons-arrow-uturn-left',
      click: () => { router.back() }
    }
  ],
  [
    {
      label: '등록',
      icon: 'i-heroicons-plus-circle',
      click: createNotebook
    },
  ]
])
</script>