import { ClientConfigProvider } from './ClientConfig'
import { ReportErrorProvider } from './ReportError'

import MiesApp from './Mies.universal'
import QueryApp from './Query.universal'
import JetApp from './Jet.universal'

import { Mies } from '/Mies'

import { stylesheet } from '@harmen/build/stylesheet'
import { javascript } from '@harmen/build/javascript'

import { content } from './aap.css'


export default (<html>
  <head>
    <title>Title</title>
    {stylesheet}
    {javascript}
  </head>
  <ReportErrorProvider reportError={(message) => console.error(`Server: ${message}`)}>
    <ClientConfigProvider config={{ aap: 'config' }}>
      <body>
        <div className={content}>mies</div>
        <Mies text='Jet' />
        <JetApp text='Jet' />
        <QueryApp />
        <MiesApp text='TeunVuurGijs' />
      </body>
    </ClientConfigProvider>
  </ReportErrorProvider>
</html>
)
