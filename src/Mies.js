export function Mies({ text }) {
  useTest()
  const [a, setA] = React.useState(0)
  return <b>WimZus<u>{text}</u><button onClick={() => setA(a => a + 1)}>Klik hier ({a})</button></b>
}

function useTest() {
  React.useEffect(
    () => {
      console.log('hallo')
    },
    []
  )
}
