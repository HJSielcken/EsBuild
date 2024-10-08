import { useQuery } from '@tanstack/react-query'
import { useReportError } from './ReportError'

export function Query() {
  const reportError = useReportError()

  reportError('Error test')
  const [item, setItem] = React.useState(1)
  const { data } = useQuery({
    queryKey: [item],
    queryFn: async () => fetch(`https://jsonplaceholder.typicode.com/todos/${item}`).then(x => x.json()),
    initialData: {},
    refetchOnMount: true
  }
  )

  return (<div>
    <code><pre>{JSON.stringify(data, null, 2)}</pre></code>
    <button onClick={() => setItem(x => x + 1)}>Fetch new data ({item})</button>
  </div>)
}
