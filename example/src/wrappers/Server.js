import { useClientConfig } from '/ClientConfig'
import { useReportError } from '/ReportError'

// eslint-disable-next-line @kaliber/no-default-export
export default function ServerWrapper({ children, ...props }) {
  const clientConfig = useClientConfig()
  const reportError = useReportError()
    const clientContext = { clientConfig, reportError }

  return React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, { clientContext })
      : child
  )
}
