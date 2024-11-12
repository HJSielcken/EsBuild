const esbuild = require('esbuild')
const path = require('path')
const crypto = require('crypto');

let universalEntryPoints = []

module.exports = { universalClientPlugin, universalServerPlugin }

function universalClientPlugin() {
  return {
    name: 'universal-client-plugin',
    setup({ onLoad }) {
      onLoad({ filter: /\.js/ }, async (args) => {
        if (isUniversalEntry(args)) return
        if (args.suffix === '?universal-loaded') return

        const slashRootPath = path.relative('./src/', args.path)

        if (args.suffix === '?universal')
          return {
            contents: createClientCode({ path: slashRootPath }),
            loader: 'jsx',
          }

        return {
          contents: createContainerlessClientCode({
            path: slashRootPath
          }),
          loader: 'jsx',
        }
      })
    }
  }
}

let context

/** @returns {import('esbuild').Plugin} */
function universalServerPlugin(getClientBuildConfig) {
  return {
    name: 'universal-server-plugin',
    setup({ onLoad, onEnd }) {
      onLoad({ filter: /\.js/ }, async (args) => {
        if (isUniversalEntry(args)) return
        if (args.suffix === '?universal-loaded') return

        universalEntryPoints.push([args.path, args.suffix].filter(Boolean).join(''))

        const slashRootPath = path.relative('./src/', args.path)

        if (args.suffix === '?universal')
          return {
            contents: createServerCode({ path: slashRootPath }),
            loader: 'jsx',
          }

        return {
          contents: createContainerlessServerCode({ path: slashRootPath }),
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

function createContainerlessClientCode({ path }) {
  const md5 = toMd5(path)

  const wrapperPath = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')

  const component = '<Component {...props} />'
  const { wrapper, wrapped } = {
    wrapper: wrapperPath ? `import Wrapper from '${wrapperPath}'` : '',
    wrapped: wrapperPath ? `<Wrapper {...props}>${component}</Wrapper>` : component,
  }

  return `|import Component from '/${path}?universal-loaded'
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

function createContainerlessServerCode({ path }) {
  const clientWrapperPath = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')
  const serverWrapperPath = get(require('@kaliber/config'), 'kaliber.universal.serverWrapper')

  const md5 = toMd5(path)

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

  return `|import Component from '/${path}?universal-loaded'
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

function createClientCode({ path }) {
  const md5 = toMd5(path)

  return `|import ClientComponent from '/${path}?universal-loaded'; 
          |const { hydrateRoot } = ReactDOM; 
          |const nodes = Array.from(document.querySelectorAll('*[data-kaliber-component-id="${md5}"]'));
          |nodes.map(x => {
          |const props = JSON.parse(x.dataset.kaliberComponent); 
          |const newElement = React.createElement(ClientComponent, props);
          |hydrateRoot(x, newElement);
          |})`.split(/^[ \t]*\|/m).join('').replace(/\n/g, '');
}

function createServerCode({ path }) {
  const md5 = toMd5(path)
  return `|import Component from '/${path}?universal-loaded'
          |import { renderToString } from 'react-dom/server'
          |
          |export default function ServerComponent(props) {
          |const content = renderToString(<Component {...props} />)
          |return (
          |<div data-kaliber-component={JSON.stringify(props)} data-kaliber-component-id='${md5}' dangerouslySetInnerHTML={{ __html: content }} />
          |)
          |}`.split(/^[ \t]*\|/m).join('')
}

function toMd5(payload) {
  return crypto.createHash('md5').update(payload).digest('hex')
}

function isUniversalEntry(args) {
  return (!(/\.universal.js$/.test(args.path) || /\?universal$/.test(args.suffix)))
}
