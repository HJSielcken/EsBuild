const crypto = require('crypto');

module.exports = ReactContainerlessUniversalClientLoader

function ReactContainerlessUniversalClientLoader({ path }) {
  const md5 = crypto.createHash('md5').update(path).digest('hex')
  const code = createServerCode({ path, md5 })

  return code
}


function createServerCode({ path, md5 }) {
  const clientWrapperPath = get(require('@kaliber/config'), 'universal.clientWrapper')
  const serverWrapperPath = get(require('@kaliber/config'), 'universal.serverWrapper')

  const client = wrap({
    importPath: clientWrapperPath,
    wrapperName: 'ClientWrapper',
    component: '<Component {...props} />',
  })

  const server = wrap({
    importPath: serverWrapperPath,
    wrapperName: 'ServerWrapper',
    component: '<PropsWrapper serverProps={props} />',
  })

  return `|import Component from './${path}?universal-loaded'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |import { ComponentServerWrapper } from '/universalComponent'
          |${server.wrapper}
          |${client.wrapper}
          |
          |assignStatics(WrappedForServer, Component)
          |
          |export default function WrappedForServer(props) {
          |  return ${server.wrapped}
          |}
          |
          |function PropsWrapper({ serverProps, ...additionalProps }) {
          |  const componentName = '${md5}'
          |  const props = { ...additionalProps, ...serverProps }
          |  const renderedComponent = renderToString(${client.wrapped})
          |  return <ComponentServerWrapper {...{ componentName, props, renderedComponent }} />
          |}
          |`.replace(/^[\s]*\|/mg, '')
}

function wrap({ wrapperName, component, importPath }) {
  return {
    wrapper: importPath ? `import ${wrapperName} from '${importPath}'` : '',
    wrapped: importPath ? `<${wrapperName} {...props}>${component}</${wrapperName}>` : component,
  }
}

function get(o, path) {
  return path.split('.').reduce((result, key) => result && result[key], o )
}
