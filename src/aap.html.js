import { content } from './aap.css'
import { stylesheet } from '@kaliber/build/stylesheet'
import { Mies } from './Mies'
import MiesApp from './Mies.universal'

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
