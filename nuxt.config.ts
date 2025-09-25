// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  ssr: false,

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    cdnURL: process.env.NUXT_APP_CDN_URL,
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
  monacoEditor: {
    // dest: '_monaco',
    locale: 'ko',
    componentName: {
      codeEditor: 'MonacoEditor',
      diffEditor: 'MonacoDiffEditor'
    }
  },
  auth: {
    // 인증 모듈 활성화 여부
    // true: 인증 기능 사용, false: 인증 비활성화
    isEnabled: true,

    // HTTP HOST 헤더 신뢰 여부 설정
    // false: HOST 헤더를 검증하여 보안 강화 (개발환경용)
    // true: HOST 헤더를 신뢰 (프록시/인그레스 환경용)
    // 쿠버네티스에서는 프록시를 통해 요청이 오므로 true 필요
    disableServerSideAuth: true,
    // originEnvKey: 'AUTH_ORIGIN',
    baseURL: process.env.NUXT_AUTH_ORIGIN  || '',
    provider: {  
      type:'authjs',
      trustHost: true,
      defaultProvider: 'keycloak',
      addDefaultCallbackUrl: true,
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    },
  },
  runtimeConfig: {
    authJs: {
      secret: process.env.AUTH_SECRET,  
      origin: process.env.NUXT_AUTH_ORIGIN
    },
    auth: {      
      keycloakUrl: process.env.NUXT_PUBLIC_KEYCLOAK_URL,
      keycloakRealm: process.env.NUXT_PUBLIC_KEYCLOAK_REALM,
      keycloakClientId: process.env.NUXT_PUBLIC_KEYCLOAK_CLIENT_ID,
      keycloakClientSecret: process.env.NUXT_KEYCLOAK_CLIENT_SECRET,
    },
    public: {
      baseURL: process.env.NUXT_APP_BASE_URL || "/clusters/local/namespaces/wise-mlops/services/web-v2/",
      enableDevAuth: process.env.NUXT_PUBLIC_ENABLE_DEV_AUTH === 'true',
      prometheusUrl: process.env.PROMETHEUS_URL || 'http://local.prometheus.web.labs.wisenut.com',
      keycloakUrl: process.env.NUXT_PUBLIC_KEYCLOAK_URL,
      keycloakRealm: process.env.NUXT_PUBLIC_KEYCLOAK_REALM,
      keycloakClientId: process.env.NUXT_PUBLIC_KEYCLOAK_CLIENT_ID
    },
  }
})