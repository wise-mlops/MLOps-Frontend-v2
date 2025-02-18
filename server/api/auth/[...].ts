import { NuxtAuthHandler } from '#auth'

export default NuxtAuthHandler({
  providers: [
    {
      id: 'dex',
      name: 'Dex',
      type: 'oauth',
      // issuer: 'http://local.dashboard.kubeflow.labs.wisenut.com/dex',
      // wellKnown: 'https://local.dashboard.kubeflow.labs.wisenut.com/dex/.well-known/openid-configuration',
      wellKnown: 'http://dex.auth.svc.cluster.local:5556/dex/.well-known/openid-configuration',
      authorization: { 
        // url: 'https://local.dashboard.kubeflow.labs.wisenut.com/dex/auth',
        url: 'http://dex.auth.svc.cluster.local:5556/dex/auth',
        params: { 
          scope: 'openid email profile' ,
          // redirect_uri: 'http://localhost:3000/api/auth/callback/dex'
          redirect_uri: 'https://labs.wisenut.kr/clusters/local/namespaces/wise-mlops/services/web-v2/api/auth/callback/dex'
          // redirect_uri: 'http://localhost:3000/api/auth/callback/dex'
        } 
      },
      
      profile( profile:any ) {
        console.log('profile', profile)
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
      clientId: process.env.DEX_CLIENT_ID,
      clientSecret: process.env.DEX_CLIENT_SECRET,

      // httpOptions: { agent: httpsAgent }
    }
  ],
  secret: process.env.NUXT_AUTH_SECRET || 'default_secret', 
})