declare const React: typeof import('react')
declare const cx: typeof import('classnames')

interface Window {
  dataLayer: Array<Object>
}

declare module '*.css'

declare module '@sielcken/esbuild/stylesheet'
declare module '@sielcken/esbuild/javascript'

declare module '*.po'

declare module '*.jpg'
declare module '*.jpeg'
declare module '*.png'

declare module '*.raw.svg' {
  const x: string
  export default x
}

interface Navigator {
  webkitConnection?: NavigatorNetworkInformation
  mozConnection?: NavigatorNetworkInformation
  connection?: NavigatorNetworkInformation
}

declare interface NavigatorNetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | 'slow-4g' | 'unknown',
  saveData?: boolean
}
