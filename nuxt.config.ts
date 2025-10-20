// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  appConfig: {
    head: {
      title: 'WISE MLOps'
    },
    api: {
      url: '/api'
    }
  },
  colorMode: {
    preference: 'light'
  },
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ["@nuxt/ui", 'nuxt-monaco-editor', '@sidebase/nuxt-auth'],
  nitro: {
    experimental: {
      wasm: true
    },
    // API 요청을 백엔드로 프록시하면서 헤더 추가
    routeRules: {
      '/api/**': {
        proxy: {
          to: `${process.env.NUXT_BACKEND_URL || 'https://labs.wisenut.kr/clusters/local/namespaces/wise-mlops/services/api-v2'}/**`,
          headers: process.env.WISENUT_AUTH_HEADER && process.env.WISENUT_AUTH_TOKEN ? {
            [process.env.WISENUT_AUTH_HEADER]: process.env.WISENUT_AUTH_TOKEN
          } : {}
        }
      }
    }
  },
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
      keycloakUrl: process.env.KEYCLOAK_URL,
      keycloakRealm: process.env.KEYCLOAK_REALM,
      keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
      keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    },
    public: {
      baseURL: process.env.APP_BASE_URL || "/",
      prometheusUrl: process.env.PROMETHEUS_URL || 'http://local.prometheus.web.labs.wisenut.com'
    },
  }
})