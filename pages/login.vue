<template>
  <div class="relative min-h-screen flex items-center justify-center bg-cover bg-center"
    style="background-image: url('https://wallpaperaccess.com/full/317501.jpg')">
    <div class="absolute inset-0 bg-black bg-opacity-50"></div>
    <div class="relative text-center text-white">
      <h1 class="text-5xl font-extrabold mb-8 drop-shadow-lg">WISE-MLOps</h1>
      <UButton size="xl" variant="solid" color="primary"
        class="px-8 py-4 text-lg font-bold shadow-lg transform hover:scale-105 transition duration-300"
        @click="handleLogin">
        Login
      </UButton>
    </div>
  </div>
</template>


<script lang="ts" setup>
function enableCustomLayout() {
  setPageLayout('login')
}

definePageMeta({
  layout: false,
});


const email = ref('user@example.com')
const password = ref('12341234')
const { signIn } = useAuth()



const handleLogin = async () => {
  try {
    const data = await signIn('dex', {
      redirect: true,
      callbackUrl: '/'
    })
    // const data = await signIn('dex')
    // 로그인 성공 처리
    console.log(data)
  } catch (error) {
    console.error('Login failed:', error)
    // 에러 처리
  }
}
</script>