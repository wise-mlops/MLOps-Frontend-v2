<template>
  <div class="flex items-stretch space-x-1 w-48">
    <div :class="colorMode.value == 'dark' ? 'logo-dark' : 'logo-light'">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <defs>
        </defs>
        <title>Asset 1</title>
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <polygon class="cls-1" points="3.85 2.31 35.3 4.16 33.91 0 3.85 2.31"></polygon>
            <polygon class="cls-1" points="2.31 35.45 4.16 4.01 0 5.39 2.31 35.45"></polygon>
            <polygon class="cls-1" points="34.76 37.69 3.32 35.84 4.7 40 34.76 37.69"></polygon>
            <polygon class="cls-1" points="36.99 4.32 35.15 35.76 39.31 34.37 36.99 4.32"></polygon>
            <path class="cls-2" d="M33.76,28.59a5.47,5.47,0,1,1-5.47-5.47,5.47,5.47,0,0,1,5.47,5.47"></path>
          </g>
        </g>
      </svg>
    </div>
    <div class="self-center px-4">
      <p class="text- font-sans font-bold antialiased">{{ title }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const colorMode = useColorMode()
const title = defineModel<string>("title", { default: 'TITLE' })


</script>

<style lang="css" scoped>
.logo-light,
.logo-dark {
  width: 30px;
}

.logo-light .cls-1 {
  fill: #191d6a
}

.logo-light .cls-2 {
  fill: #f4a000
}

.logo-dark .cls-1,
.logo-dark .cls-2 {
  fill: white
}
</style>
