const reportErrorContext = React.createContext(null)

export function useReportError() {
  const reportError = React.useContext(reportErrorContext)
  return reportError
}

export function ReportErrorProvider({ reportError, children }) {
  return <reportErrorContext.Provider value={reportError} {...{ children }} />
}
