const esbuild = require('esbuild')
const path = require('path')
const crypto = require('crypto');

let universalEntryPoints = []

module.exports = { universalClientPlugin, universalServerPlugin }

function universalClientPlugin() {
  return {
    name: 'universal-client-plugin',
    setup({ onLoad }) {
      onLoad({ filter: /\.universal.js/ }, async (args) => {
        if (args.suffix === '?universal-loaded') return
        const newFile = createClientCode({
          path: args.path.replace(path.resolve(process.cwd(), 'src'), ''),
        })

        return {
          contents: newFile,
          loader: 'jsx',
        }
      })
    }
  }
}

/** @returns {import('esbuild').Plugin} */
function universalServerPlugin(getClientBuildConfig) {
  return {
    name: 'universal-server-plugin',
    setup({ onLoad, onEnd }) {
      onLoad({ filter: /\.universal.js/ }, async (args) => {
        if (args.suffix === '?universal-loaded') return

        universalEntryPoints.push(args.path)

        return {
          contents: createServerCode({ path: args.path.replace(path.resolve(process.cwd(), 'src'), '') }),
          loader: 'jsx',
        }
      }),
        onEnd(async _ => {
          console.log('Building client')
          const { watch, ...config } = getClientBuildConfig(universalEntryPoints)
          if (watch) {
            context = await esbuild.context(config)
            await context.rebuild()
          } else {
            await esbuild.build(config)
          }
          console.log('Finished building client')
        })
    }
  }
}


function createClientCode({ path }) {
  const md5 = crypto.createHash('md5').update(path).digest('hex')

  const wrapperPath = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')

  const component = '<Component {...props} />'
  const { wrapper, wrapped } = {
    wrapper: wrapperPath ? `import Wrapper from '${wrapperPath}'` : '',
    wrapped: wrapperPath ? `<Wrapper {...props}>${component}</Wrapper>` : component,
  }

  return `|import Component from '${path}?universal-loaded'
          |import { findComponents, hydrate } from '@kaliber/esbuild/plugins/universalComponent'
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

function createServerCode({ path }) {
  const clientWrapperPath = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')
  const serverWrapperPath = get(require('@kaliber/config'), 'kaliber.universal.serverWrapper')

  const md5 = crypto.createHash('md5').update(path).digest('hex')

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

  return `|import Component from '${path}?universal-loaded'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |import { ComponentServerWrapper } from '@kaliber/esbuild/plugins/universalComponent'
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
  return path.split('.').reduce((result, key) => result && result[key], o)
}
