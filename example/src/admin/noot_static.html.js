import QueryApp from '/Query.universal'
import { Mies } from '/Mies'
import JetApp from '/Jet.universal'

import { stylesheet } from '@kaliber/build/stylesheet'
import { javascript } from '@kaliber/build/javascript'

import { content } from './aaps.css'
import { ClientConfigProvider } from '/ClientConfig'
import { ReportErrorProvider } from '/ReportError'

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
      </body>
    </ClientConfigProvider>
  </ReportErrorProvider>
</html>
)
