// https://nuxt.com/docs/api/configuration/nuxt-config


export default defineNuxtConfig({
  appConfig: {
    head: {
      title: 'WISE MLOps'
    },
    api: {
      // url: 'https://labs.wisenut.kr/clusters/local/namespaces/wise-mlops/services/api/'
      url: 'https://labs.wisenut.kr/clusters/local/namespaces/wise-mlops/services/api-v2/'
    }
  },
  colorMode: {
    preference: 'light'
  },
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ["@nuxt/ui", 'nuxt-monaco-editor', '@sidebase/nuxt-auth'],
  ssr: false,
  monacoEditor: {
    // dest: '_monaco',
    locale: 'ko',
    componentName: {
      codeEditor: 'MonacoEditor',
      diffEditor: 'MonacoDiffEditor'
    }
  },
  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    originEnvKey: 'NUXT_AUTH_ORIGIN',
    baseURL: 'https://labs.wisenut.kr/clusters/local/namespaces/wise-mlops/services/web-v2/api/auth',
    provider: {  
      type:'authjs',
      trustHost: false,
      defaultProvider: 'dex',
      addDefaultCallbackUrl: true
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    }
  }
})