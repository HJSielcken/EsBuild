declare const React: typeof import('react')
declare const cx: typeof import('classnames')

interface Window {
  dataLayer: Array<Object>
}

declare module '*.css'

declare module '@sielcken/esbuild/javascript' {
  const javascript
  export { javascript }
}

declare module '@sielcken/esbuild/stylesheet' {
  const stylesheet
  export { stylesheet }
}
declare module '*.po'

declare module '*.jpg'
declare module '*.jpeg'
declare module '*.png'
declare module '*?universal'


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
