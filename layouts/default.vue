<template>
  <div class="h-lvh flex flex-col">
    <LayoutNavTop />
    <LayoutNavSide />
    <div class="mt-16 p-4 sm:ml-64 grow">
      <slot />
    </div>
  </div>
</template>