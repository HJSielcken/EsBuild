import { ClientConfigProvider } from '/ClientConfig'
import { ReportErrorProvider } from '/ReportError'

// eslint-disable-next-line @kaliber/no-default-export
export default function ClientWrapper({ children, ...props }) {
  const { clientContext } = props

  return (
    <ReportErrorProvider reportError={clientContext.reportError || ((message) => console.error(`Client: ${message}`))}>
      <ClientConfigProvider config={clientContext.clientConfig}>
        {children}
      </ClientConfigProvider>
    </ReportErrorProvider>
  )
}
