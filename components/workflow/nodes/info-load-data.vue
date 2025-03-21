<template>
  <div>
    <div v-for="item in items" :key="item.id">
      <UFormGroup :label="item.label" :name="item.id" class="py-2">
        <UInput type="text" v-model="item.value" placeholder="Value" variant="outline" size="md" autocomplete="off" />
      </UFormGroup>
    </div>
  </div>
</template>


<script setup lang="ts">

interface Item {
  id: string
  label: string
  type: string
  value: string
}

const params = defineModel<Item[]>({ default: [] })


const items = ref([
  {
    id: 'endpoint_url',
    label: 'Endpoint URL',
    type: 'string',
    value: 'http://storage-system-minio.storage-system.svc.cluster.local:9000'
  },
  {
    id: 'access_key',
    label: 'Access Key',
    type: 'string',
    value: 'minio'
  },
  {
    id: 'secret_key',
    label: 'Secret Key',
    type: 'string',
    value: 'minio123'
  },
  {
    id: 'bucket_name',
    label: 'Bucket Name',
    type: 'string',
    value: ''
  },
  {
    id: 'object_path',
    label: 'Object Path',
    type: 'string',
    value: ''
  },

])

const componentType = ref('load_data_from_storage')

watch(items.value, (newItems) => {
  params.value = newItems
})

onMounted(() => {
  if (params.value.length > 0) {
    items.value = params.value
  }
})
</script>
