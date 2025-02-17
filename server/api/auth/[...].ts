import { NuxtAuthHandler } from '#auth'

import https from 'https'

export default NuxtAuthHandler({
  providers: [
    {
      id: 'dex',
      name: 'Dex',
      type: 'oauth',
      wellKnown: 'http://local.dashboard.kubeflow.labs.wisenut.com/dex/.well-known/openid-configuration',
      authorization: { 
        url: 'http://local.dashboard.kubeflow.labs.wisenut.com/dex/auth',
        params: { 
          scope: 'openid email profile' ,
          redirect_uri: 'http://localhost:3000/api/auth/callback/dex'
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
      clientId: 'kubeflow-oidc-authservice',      
      clientSecret: process.env.DEX_CLIENT_SECRET || 'REPLACE_WITH_YOUR_SECRET',

      // httpOptions: { agent: httpsAgent }
    }
  ],
  secret: process.env.NUXT_AUTH_SECRET || 'default_secret',  
})