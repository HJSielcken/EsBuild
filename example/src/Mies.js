import { useIsMountedRef } from '@kaliber/use-is-mounted-ref'
import { useClientConfig } from './ClientConfig'
export function Mies({ text }) {
  const config = useClientConfig()
  console.log({ config })
  
  const isMounted = useIsMountedRef()
  const [a, setA] = React.useState(0)

  return <b>WimZus<u>{text}</u><button onClick={() => setA(a => a + 1)}>Klik hier ({a})</button></b>

  function useTest() {
    React.useEffect(
      () => {
        console.log('hallo')
      },
      []
    )
  }

}
