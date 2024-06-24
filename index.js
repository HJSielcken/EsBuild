const { nodeExternalsPlugin } = require('esbuild-node-externals');
const esbuild = require('esbuild')
const importFresh = require('import-fresh')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

const templateRenderers = {
  json: 'json-renderer.js',
  html: 'html-react-renderer.js',
}

build()
// watch()

async function build() {
  await buildClient()
  await buildServer()
}

async function buildServer() {
  const config = getServerBuildConfig()
  await esbuild.build(config)
}

async function buildClient() {
  const config = getClientBuildConfig()
  await esbuild.build(config)
}

async function watch() {
  const clientConfig = getClientBuildConfig()
  const serverConfig = getServerBuildConfig()
  const clientContext = await esbuild.context(clientConfig)
  const serverContext = await esbuild.context(serverConfig)

  await clientContext.watch()
  await serverContext.watch()
}

function getClientBuildConfig() {
  return {
    entryPoints: getEntryPoints({ universal: null }),
    outdir: targetDir,
    metafile: true,
    bundle: true,
    // format: 'esm',
    platform: 'browser',
    // splitting: false,
    loader: {
      '.js': 'jsx',
      '.css': 'local-css',
    },
    entryNames: '[dir]/[name]-browser',
    inject: ['./externals-browser.js'],
    plugins: [
      universalClientLoaderPlugin(),
      writeMetaFilePlugin('browser-metafile.json'),
    ]
  }
}

function writeMetaFilePlugin(filename) {
  return {
    name: 'write-metafile-plugin',
    setup({ onEnd }) {
      onEnd(({ metafile }) => {
        // console.log(metafile)
        fs.writeFileSync(`./${filename}`, JSON.stringify(metafile, null, 2))
      }
      )
    }
  }
}

function getServerBuildConfig() {
  return {
    entryPoints: getEntryPoints(templateRenderers),
    outdir: targetDir,
    metafile: true,
    bundle: true,
    platform: 'node',
    loader: {
      '.js': 'jsx',
      '.css': 'local-css',
    },
    entryNames: '[dir]/[name]',
    format: 'cjs',
    inject: ['./externals.js'],
    plugins: [
      cssLoaderPlugin(),
      javascriptLoaderPlugin(),
      universalServerLoaderPlugin(),
      writeMetaFilePlugin('server-metafile.json'),
      templateRendererPlugin(),
      nodeExternalsPlugin()
    ]
  }
}

function universalClientLoaderPlugin() {
  return {
    name: 'universal-loader-plugin',
    setup({ onLoad }) {
      onLoad({ filter: /\.universal.js/ }, async (args) => {

        if (args.suffix === '?universal') return
        const newFile = clientSnippet({
          path: args.path,
        })

        return {
          contents: newFile,
          loader: 'jsx',
        }
      })
    }
  }

  function clientSnippet({ path }) {
    const md5 = crypto.createHash('md5').update(path).digest('hex')

    return `|import ClientComponent from '${path}?universal'; 
            |const { hydrateRoot } = ReactDOM; 
            |const nodes = Array.from(document.querySelectorAll('*[data-kaliber-component-id="${md5}"]'));
            |nodes.map(x => {
            |const props = JSON.parse(x.dataset.kaliberComponent); 
            |const newElement = React.createElement(ClientComponent, props);
            |hydrateRoot(x, newElement);
            |})`.split(/^[ \t]*\|/m).join('').replace(/\n/g, '');
  }
}

function universalServerLoaderPlugin() {
  return {
    name: 'universal-loader-plugin',
    setup({ onLoad }) {
      onLoad({ filter: /\.universal.js/ }, async (args) => {
        if (args.suffix === '?universal') return

        return {
          contents: serverSnippet({ path: args.path, }),
          loader: 'jsx',
        }
      })
    }
  }

  function serverSnippet({ path }) {
    const [filename] = path.split('/').slice(-1)
    const scriptname = filename.replace('universal', 'universal-browser')
    const md5 = crypto.createHash('md5').update(path).digest('hex')

    return `|import Component from '${path}?universal'
            |import { renderToString } from 'react-dom/server'
            |
            |export default function ServerComponent(props) {
            |const content = renderToString(<Component {...props} />)
            |return (
            |<>
            |<div data-kaliber-component={JSON.stringify(props)} data-kaliber-component-id='${md5}' dangerouslySetInnerHTML={{ __html: content }} />
            |</>
            |)
            |}`.split(/^[ \t]*\|/m).join('')
  }
}
// |<script src="${scriptname}"></script>


function cssLoaderPlugin() {
  return {
    name: 'css-loader-plugin',
    setup(build) {
      build.onResolve({ filter: /^\@kaliber\/build\/stylesheet$/ }, args => {
        return {
          path: args.path,
          namespace: args.importer,
        }
      })
      build.onLoad({ filter: /^\@kaliber\/build\/stylesheet$/ }, args => {
        return {
          loader: 'jsx',
          contents: createStyleSheet(args.namespace)
        }
      })
    }
  }
}

function templateRendererPlugin() {
  return {
    name: 'template-renderer-plugin',
    setup(build) {
      build.onEnd(({ metafile }) => {
        fs.writeFileSync('./metafile.json', JSON.stringify(metafile, null, 2))
        const { outputs } = metafile

        Object.keys(outputs).filter(x => x.endsWith('html.js')).forEach(filePath => {
          console.log(filePath)

          const { rendererFilename, filename } = getFileAndRendererInfo(filePath)
          const module = importFresh(path.resolve(targetDir, filename))
          console.log(filePath)

          if (typeof module.default === 'function') {
            const dynamicTemplate = createDynamicTemplate(filename, rendererFilename)
            const newFilename = filename
            fs.writeFileSync(newFilename, dynamicTemplate)
          } else {
            const renderer = importFresh(path.resolve(pwd, rendererFilename))
            const content = renderer(module.default)
            fs.writeFileSync(path.resolve(targetDir, filename.replace(/\.js$/, '')), content)
            fs.unlinkSync(path.resolve(targetDir, filename))
          }
        })

        console.log('Finished')
      })
    }
  }
}

function getFileAndRendererInfo(filePath) {
  const extension = filePath.split('.').toReversed()[1]
  const filename = filePath.replace('target/', '')
  const rendererFilename = templateRenderers[extension]
  return { rendererFilename, filename }
}

function getEntryPoints(templateRenderers) {
  const entries = fs.readdirSync(srcDir)
  const extensions = Object.keys(templateRenderers).join('|')
  const filteredEntries = entries.filter(x => new RegExp(`(${extensions})\.js$`).test(x)).map(x => path.resolve(srcDir, x))

  return filteredEntries
}

function createDynamicTemplate(sourceLocation, rendererLocation) {
  return `
     |const renderer = require('./${rendererLocation}')
     |const source = require('./target/${sourceLocation}')
     |const React = require('react)
     |Object.assign(render, source)
     |
     |module.exports = render
     |
     |function render(props) {
     |  return renderer(source.default(props))
     |}
     |`.replace(/^[ \t]*\|/gm, '')
}

function createStyleSheet(entryPoint) {
  const stylesheet = entryPoint.replace(pwd, '').slice(1)
  return `
  |export const stylesheet = <link rel="stylesheet" href={getCssBundle("${stylesheet}")} />
  |
  |function getCssBundle(entrypoint) {
  |  const metafile = JSON.parse(fs.readFileSync('./metafile.json'))
  |  const output = Object.values(metafile.outputs).find(x => x.entryPoint === entrypoint)
  |  return output.cssBundle.replace('target','.')
  |}
  `.replace(/^[ \t]*\|/gm, '')
}


function javascriptLoaderPlugin() {
  return {
    name: 'javascript-loader-plugin',
    setup(build) {
      build.onResolve({ filter: /^\@kaliber\/build\/javascript$/ }, args => {
        return {
          path: args.path,
          namespace: args.importer,
        }
      })
      build.onLoad({ filter: /^\@kaliber\/build\/javascript$/ }, args => {
        return {
          loader: 'jsx',
          contents: createScriptTags(args.namespace)
        }
      })
    }
  }
}

function createScriptTags(entryPoint) {
  return `
  |export const javascript = determineScripts('${entryPoint.replace(pwd, '').slice(1)}').map((x,idx)=><script key={idx} src={x} defer></script>)
  |
  |function determineScripts(entryPoint) {
  |  const metafile = JSON.parse(fs.readFileSync('./server-metafile.json'))
  |  const { inputs } = Object.values(metafile.outputs).find(x => x.entryPoint === entryPoint)
  |  return Object.keys(inputs).filter(x => x.endsWith('.universal.js'))
  |         .map(x => x.replace('src', '.').replace('universal', 'universal-browser'))
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
