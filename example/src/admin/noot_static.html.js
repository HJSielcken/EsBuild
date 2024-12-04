import QueryApp from '/Query.universal'
import { Mies } from '/Mies'
import JetApp from '/Jet.universal'
import { ClientConfigProvider } from '/ClientConfig'
import { ReportErrorProvider } from '/ReportError'

import { stylesheet } from '@harmen/esbuild/stylesheet'
import { javascript } from '@harmen/esbuild/javascript'

import styles from './aaps.css'

export default (<html>
  <head>
    <title>Title</title>
    {stylesheet}
    {javascript}
  </head>
  <ReportErrorProvider reportError={(message) => console.error(`Server: ${message}`)}>
    <ClientConfigProvider config={{ aap: 'config' }}>

      <body>
        <div className={styles.content}>mies</div>
        <Mies text='Jet' />
        <JetApp text='Jet' />
        <QueryApp />
      </body>
    </ClientConfigProvider>
  </ReportErrorProvider>
</html>
)
