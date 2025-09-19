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
          <UFormGroup label="Notebook Name" name="notebook_name" class="py-2" help="Enter lowercase letters"
            :ui="{ help: 'text-xs text-gray-400' }">
            <UInput v-model="notebookForm.name" placeholder="Input Name" variant="outline" size="md"
              autocomplete="off" />
          </UFormGroup>
          <UFormGroup label="Notebok Image" name="notebook_name" class="py-2">
            <USelectMenu v-model="notebookForm.notebookImage" :options="images" option-attribute="label"
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
              <UInput type="number" v-model="notebookForm.minCpu" placeholder="Minimum CPU" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
            <UFormGroup label="Maximum CPU" name="maxCpu" class="py-2">
              <UInput type="number" v-model="notebookForm.maxCpu" placeholder="Maximum CPU" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
          </div>
          <div class="w-1/2 sm:w-1/2 mx-2">
            <UFormGroup label="Minimum Memory" name="minMemory" class="py-2">
              <UInput type="number" v-model="notebookForm.minMemory" placeholder="Minimum Memory" variant="outline"
                size="md" autocomplete="off" />
            </UFormGroup>
            <UFormGroup label="Maximum Memory" name="maxMemory" class="py-2">
              <UInput type="number" v-model="notebookForm.maxMemory" placeholder="Maximum Memory" variant="outline"
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
              <USelectMenu v-model="notebookForm.numGpu" :options="numGpus" option-attribute="label"
                value-attribute="value" size="md" />
            </UFormGroup>
          </div>
          <div class="w-1/2 sm:w-1/2 mx-2">
            <UFormGroup label="GPU Vendor" name="gpuVendor" class="py-2">
              <USelectMenu v-model="notebookForm.gpuVendor" :options="gpuVendors" option-attribute="label"
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
              <UInput v-model="notebookForm.volumeName" placeholder="Volume Name" variant="outline" size="md"
                autocomplete="off" />
            </UFormGroup>
          </div>
          <div class="">
            <UFormGroup label="Size in Gi" name="volumeSize" class="py-2">
              <UInput type="number" v-model="notebookForm.volumeSize" placeholder="Size in Gi" variant="outline"
                size="md" autocomplete="off" />
            </UFormGroup>
            <URadioGroup v-model="notebookForm.accessMode" legend="Access mode" :options="accessModes" class="py-2" />
            <UFormGroup label="Mounth Path" name="mountPath" class="py-2">
              <UInput v-model="notebookForm.mountPath" placeholder="Mount Path" variant="outline" size="md"
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

const notebookForm = ref({
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
  volumeName: '-volume',
  volumeSize: 10,
  useDefaultStorageClass: true,
  accessMode: 'ReadWriteOnce',
  mountPath: '/home/workspace',
})
const notebook = ref({
  metadata: {
    name: "aaa",
    labels: {},
    annotations: {},
    create_date: new Date
  },
  template_pod: {
    metadata: {
      name: "aaa",
      labels: {},
      annotations: {},
      create_date: new Date
    },
    containers: [
      {
        name: "string",
        image: "nginx",
        image_pull_policy: "IfNotPresent",
        env: {},
        args: [],
        command: [],
        volume_mounts: [],
        cpu: "0.5",
        memory: "1Gi",
        gpu: "0"
      }
    ],
    image_pull_secrets: [
      "backend-image-pull-secret-v2"
    ],
    volumes: [],
    service_account_name: "default"
  }
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
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/pytorch:1.8.0'
  },
  {
    label: 'jupyter-scikit-learn:v1.8.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/scikit-learn:1.8.0'
  },
  {
    label: 'jupyter-tensorflow:v1.8.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/tensorflow:1.8.0'
  },
  {
    label: 'jupyter-keras:v1.8.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/keras:1.8.0'
  },
  {
    label: 'jupyter-mxnet:1.9.1',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/mxnet:1.9.1'
  },
  {
    label: 'jupyter-xgboost:2.1.1',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/xgboost:2.1.1'
  },
  {
    label: 'jupyter-lightgbm:4.5.0',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/lightgbm:4.5.0'
  },
  {
    label: 'jupyter-huggingface-transformers:4.47.1',
    value: 'registry.gitlab.com/wisenut-research/research/2022-iitp-mlops/mlops-platform/mlops-api-v2/huggingface-transformers:4.47.1'
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
    value: 'ReadWriteOnce'
  },
  {
    label: 'ReadOnlyMany',
    value: 'ReadOnlyMany'
  },
  {
    label: 'ReadWriteMany',
    value: 'ReadWriteMany'
  }
])


const addNotebook = async () => {
  notebook.value.metadata.name = notebookForm.value.name ? notebookForm.value.name.toLowerCase() : ''
  notebook.value.template_pod.metadata.name = notebookForm.value.name ? notebookForm.value.name.toLowerCase() : ''
  notebook.value.template_pod.containers[0].name = notebookForm.value.name ? notebookForm.value.name : ''
  notebook.value.template_pod.containers[0].image = notebookForm.value.notebookImage ? notebookForm.value.notebookImage : ''
  notebook.value.template_pod.containers[0].cpu = notebookForm.value.minCpu ? notebookForm.value.minCpu.toString() : ''
  notebook.value.template_pod.containers[0].memory = notebookForm.value.minMemory ? notebookForm.value.minMemory.toString() + 'Gi' : ''
  notebook.value.template_pod.containers[0].gpu = notebookForm.value.numGpu ? notebookForm.value.numGpu.toString() : '0'
  // notebook.value.template_pod.containers[0].volume_mounts[0].name = notebookForm.value.volumeName ? notebookForm.value.volumeName : 'test'
  // notebook.value.template_pod.containers[0].volume_mounts[0].mountPath = notebookForm.value.mountPath ? notebookForm.value.mountPath : '/home/workspace'
  // notebook.value.template_pod.volumes[0].name = notebookForm.value.volumeName ? notebookForm.value.volumeName : 'test'

  createNotebook('kubeflow-user-example-com', notebook)
    .then(response => {
      if (response && response.code == 130200) {
        navigateTo(`/notebooks`, {
          replace: true,
          redirectCode: 301,
          external: true
        })
      } else {
        alert("오류[" + response.code + "]: " + response.message)
      }
    })


}

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
      click: addNotebook
    },
  ]
])
</script>