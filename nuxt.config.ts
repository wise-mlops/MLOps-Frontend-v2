// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  appConfig: {
    head: {
      title: 'WISE MLOps'
    },
    api: {
      url: process.env.APP_BACKEND_URL || 'https://labs.wisenut.kr/clusters/local/namespaces/wise-mlops/services/api-v2/'
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
      keycloakUrl: process.env.KEYCLOAK_URL,
      keycloakRealm: process.env.KEYCLOAK_REALM,
      keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
      keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    },
    public: {
      baseURL: process.env.APP_BASE_URL || "/",
      prometheusUrl: process.env.PROMETHEUS_URL || 'http://local.prometheus.web.labs.wisenut.com'
    },
  },
  nitro: {
    devProxy: {
      '/api/cubox': {
        target: 'http://mlops.cubox.ai',
        changeOrigin: true,
        prependPath: true,
        pathRewrite: {
          '^/api/cubox': ''
        },
        headers: {
          'Origin': 'http://mlops.cubox.ai',
          'Referer': 'http://mlops.cubox.ai'
        },
        onProxyReq: (proxyReq, req, res) => {
          // Remove problematic headers
          proxyReq.removeHeader('referrer-policy')
          proxyReq.removeHeader('sec-fetch-dest')
          proxyReq.removeHeader('sec-fetch-mode')
          proxyReq.removeHeader('sec-fetch-site')
        }
      }
    }
  }
})