import MiesApp from './Mies.universal'
import QueryApp from './Query.universal'
import JetApp from './Jet.universal'
import { Mies } from './Mies'
import { routeMap } from './routeMap'

import { stylesheet } from '@kaliber/build/stylesheet'
import { javascript } from '@kaliber/build/javascript'

import { content } from './aap.css'
import { pick } from '@kaliber/routing'

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
    <body>
      <div className={content}>mies <br/>{title}</div>
      <Mies text='Jet' />
      <JetApp text='Jet' />
      <QueryApp />
      <MiesApp text='TeunVuurGijs' />
    </body>
  </html>
  )
}
