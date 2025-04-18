<template>
  <div class="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition duration-200"
    :class="{ 'bg-gray-100 border-primary': isDragging }" @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
    <p class="text-gray-500 mb-4">
      여러 파일을 <strong>드래그</strong>하거나 <strong>클릭</strong>하여 업로드하세요
    </p>

    <UButton @click="triggerFileInput">파일 선택</UButton>

    <input ref="fileInput" type="file" multiple class="hidden" @change="onFileChange" />

    <ul v-if="selectedFiles.length" class="mt-6 text-left space-y-2">
      <li v-for="(file, index) in selectedFiles" :key="index"
        class="flex justify-between items-center bg-gray-100 rounded-lg px-4 py-2">
        <span class="text-sm text-gray-700 truncate max-w-[80%]">{{ file.name }}</span>
        <UButton color="red" variant="ghost" icon="i-heroicons-x-mark" size="xs" @click="removeFile(index)" />
      </li>
    </ul>
  </div>
</template>

<script setup>
const fileInput = ref(null)
const isDragging = ref(false)
const selectedFiles = ref([])

const emit = defineEmits(['files-selected'])

const updateEmit = () => {
  emit('files-selected', selectedFiles.value)
}

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (event) => {
  isDragging.value = false
  const newFiles = Array.from(event.dataTransfer.files)
  if (newFiles.length) {
    selectedFiles.value.push(...newFiles)
    updateEmit()
  }
}

const onFileChange = (event) => {
  const newFiles = Array.from(event.target.files)
  if (newFiles.length) {
    selectedFiles.value.push(...newFiles)
    updateEmit()
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
  updateEmit()
}
</script>
