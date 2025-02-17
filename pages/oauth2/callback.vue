<template>
  <div>
    <p>Authenticating...</p>
  </div>
</template>

<script setup>
import { useAuth } from '@sidebase/nuxt-auth'

const { handleCallback } = useAuth()

// 콜백을 처리하고 사용자 정보를 가져옴
await handleCallback()
</script>
