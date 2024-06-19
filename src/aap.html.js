import { content } from './aap.css'
import { stylesheet } from '@kaliber/build/stylesheet'

export default function Index({ title }) {
  return (<html>
    <head>
      <title>{title}</title>
      {stylesheet}
    </head>
    <body>
      <div className={content}>mies</div>
    </body>
  </html>
  )
}
