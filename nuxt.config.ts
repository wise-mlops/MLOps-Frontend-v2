// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    cdnURL: process.env.NUXT_APP_BASE_URL || '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      base: { href: process.env.NUXT_APP_BASE_URL || '/' }
    }
  },
  appConfig: {
    head: {
      title: 'WISE MLOps'
    },
    api: {
      // url : process.env.APP_BACKEND_URL || '',
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
    // originEnvKey: 'AUTH_ORIGIN',
    baseURL: process.env.AUTH_ORIGIN  || '',
    provider: {  
      type:'authjs',
      trustHost: false,
      defaultProvider: 'keycloak',
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    },
  },
  runtimeConfig: {
    auth: {      
      keycloakUrl: process.env.NUXT_PUBLIC_KEYCLOAK_URL,
      keycloakRealm: process.env.NUXT_PUBLIC_KEYCLOAK_REALM,
      keycloakClientId: process.env.NUXT_PUBLIC_KEYCLOAK_CLIENT_ID,
      keycloakClientSecret: process.env.NUXT_KEYCLOAK_CLIENT_SECRET,
    },
    public: {
      baseURL: process.env.NUXT_APP_BASE_URL || "/",
      enableDevAuth: process.env.NUXT_PUBLIC_ENABLE_DEV_AUTH === 'true',
      prometheusUrl: process.env.PROMETHEUS_URL || 'http://local.prometheus.web.labs.wisenut.com',
      keycloakUrl: process.env.NUXT_PUBLIC_KEYCLOAK_URL,
      keycloakRealm: process.env.NUXT_PUBLIC_KEYCLOAK_REALM,
      keycloakClientId: process.env.NUXT_PUBLIC_KEYCLOAK_CLIENT_ID
    },
  },
  nitro: {
    preset: 'node-server'
  }
})