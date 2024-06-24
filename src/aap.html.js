import MiesApp from './Mies.universal'
import { Mies } from './Mies'

import { stylesheet } from '@kaliber/build/stylesheet'
import { content } from './aap.css'

export default function Index({ title }) {
  return (<html>
    <head>
      <title>{title}</title>
      {stylesheet}
    </head>
    <body>
      <div className={content}>mies</div>
      <Mies text='Jet'/>
      <MiesApp text='TeunVuurGijs'/>
    </body>
  </html>
  )
}
