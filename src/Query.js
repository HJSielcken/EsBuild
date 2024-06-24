import { useQuery } from '@tanstack/react-query'

export function Query() {
  const [item, setItem] = React.useState(0)
  const { data } = useQuery({
    queryKey: [item],
    queryFn: async () => fetch(`https://jsonplaceholder.typicode.com/todos/${item}`).then(x => x.json()),
    initialData: {}
  }
  )

  return (<div>
    <code><pre>{JSON.stringify(data, null, 2)}</pre></code>
    <button onClick={() => setItem(x => x + 1)}>Fetch new data ({item})</button>
  </div>)
}
