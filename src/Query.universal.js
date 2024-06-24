import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Query } from './Query'

const client = new QueryClient()

export default function QueryApp() {
  return (
    <QueryClientProvider {...{ client }}>
      <Query />
    </QueryClientProvider>
  )
}
