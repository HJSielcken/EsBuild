import { pick } from '@kaliber/routing'
import { ClientConfigProvider } from './ClientConfig'
import { ReportErrorProvider } from './ReportError'
import { routeMap } from './routeMap'
import { stylesheet } from '@harmen/esbuild/stylesheet'
import { javascript } from '@harmen/esbuild/javascript'

import MiesApp from './Mies.universal'
import QueryApp from './Query.universal'
import JetApp from './Jet.universal'
import { Mies } from './Mies'

import styles from './aap.css'

Index.routes = {
  match(location) {
    console.log({ location })
    return pick(
      location.pathname,
      [routeMap, (_, route) => ({ status: 200, data: {title: 'asdasd'} })],
      [routeMap.notFound, (_, route) => ({ status: 404, data: route.data })],
    )
  }
}

export default function Index({ data }) {
  const { title, status } = data
  if (status === 404) return <h1>Not found - {title}</h1>
  return (<html>
    <head>
      <title>{title}</title>
      {stylesheet}
      {javascript}
    </head>
    <ReportErrorProvider reportError={(message) => console.error(`Server: ${message}`)}>
      <ClientConfigProvider config={{ aap: 'config' }}>
        <body>
          <div className={styles.content}>mies <br />{title}</div>
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
