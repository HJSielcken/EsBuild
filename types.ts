declare const React: typeof import('react')
declare const cx: typeof import('classnames')

interface Window {
  'Rollbar': import('rollbar'),
  dataLayer: Array<Object>
}

declare module '*.css'

declare module '@kaliber/build/stylesheet'
declare module '@kaliber/build/javascript'

declare module React {
  interface CSSProperties {
    '--index'?: string | number
    '--aspect-ratio'?: string | number
    '--offset-submenu'?: string | number
    '--submenu-background-scaleY'?: string | number
    '--z-index'?: string | number
    '--delay'?: string | number
    '--total-delay'?: string | number
    '--container-width'?: string | number
    '--container-height'?: string | number
    '--min-height-card'?: string | number
  }
}

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
