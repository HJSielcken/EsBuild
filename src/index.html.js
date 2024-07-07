import { pick } from '@kaliber/routing'
import { ClientConfigProvider } from './ClientConfig'
import { Mies } from './Mies'
import { stylesheet } from '@kaliber/build/stylesheet'
import { javascript } from '@kaliber/build/javascript'

import MiesApp from './Mies.universal'
import QueryApp from './Query.universal'
import JetApp from './Jet.universal'
import { routeMap } from './routeMap'

import { content } from './aap.css'
import { ReportErrorProvider } from './ReportError'

Index.routes = {
  match(location) {
    return pick(
      location.pathname,
      [routeMap, async (_, route) => ({ status: 200, data: route.data })],
      [routeMap.notFound, (_, route) => ({ status: 404, data: route.data })],
    )
  }
}

export default function Index({ data }) {
  const { title } = data
  return (<html>
    <head>
      <title>{title}</title>
      {stylesheet}
      {javascript}
    </head>
    <ReportErrorProvider reportError={(message) => console.error(`Server: ${message}`)}>
      <ClientConfigProvider config={{ aap: 'config' }}>
        <body>
          <div className={content}>mies <br />{title}</div>
          <Mies text='Jet' />
          <JetApp text='Jet' />
          <QueryApp />
          <MiesApp text='TeunVuurGijs' />
        </body>
      </ClientConfigProvider>
    </ReportErrorProvider>
  </html>
  )
}
