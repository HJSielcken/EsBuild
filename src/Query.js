import { useQuery } from '@tanstack/react-query'

export function Query() {
  const { data } = useQuery({
      queryKey: ['nl'],
      queryFn: async () => fetch('https://jsonplaceholder.typicode.com/todos/1').then(x=>x.json()),
      initialData: {}
    }
  )

  return <code><pre>{JSON.stringify(data)}</pre></code>
}
