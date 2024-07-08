
const crypto = require('crypto');

module.exports = ReactContainerlessUniversalClientLoader

function ReactContainerlessUniversalClientLoader({path}) {
  const md5 = crypto.createHash('md5').update(path).digest('hex')
  const code = createClientCode({ path, md5 })

  return code
}

function createClientCode({ path, md5 }) {
  const wrapperPath = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')

  const component = '<Component {...props} />'
  const { wrapper, wrapped } = {
    wrapper: wrapperPath ? `import Wrapper from '${wrapperPath}'` : '',
    wrapped: wrapperPath ? `<Wrapper {...props}>${component}</Wrapper>` : component,
  }

  return `|import Component from '${path}?universal-loaded'
          |import { findComponents, hydrate } from '@kaliber/esbuild/universalComponent'
          |${wrapper}
          |
          |const components = findComponents({ componentName: '${md5}' })
          |const renderResults = components.map(componentInfo => {
          |  const { props } = componentInfo
          |  return { props, result: hydrate(${wrapped}, componentInfo) }
          |})
          |
          |`.split(/^[ \t]*\|/m).join('')
}

function get(o, path) {
  return path.split('.').reduce((result, key) => result && result[key], o )
}
