import MiesApp from './Mies.universal'
import QueryApp from './Query.universal'
import JetApp from './Jet.universal'
import { Mies } from './Mies'

import { stylesheet } from '@kaliber/build/stylesheet'
import { javascript } from '@kaliber/build/javascript'

import { content } from './aap.css'

export default (<html>
  <head>
    <title>Title</title>
    {stylesheet}
    {javascript}
  </head>
  <body>
    <div className={content}>mies</div>
    <Mies text='Jet' />
    <JetApp text='Jet' />
    <QueryApp />
    <MiesApp text='TeunVuurGijs' />
  </body>
</html>
)
