const esbuild = require('esbuild')
const importFresh = require('import-fresh')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto');
const walkSync = require('walk-sync');
const config = require('@kaliber/config')

const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

const { nodeExternalsPlugin } = require('esbuild-node-externals');

const { templateRenderers } = config

build()
// watch()

async function build() {
  await buildClient().then(_ => buildServer()).catch(x => console.log(x)).finally(x => { console.log('Finished'); process.exit('1') })

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
    preserveSymlinks: true,
    outdir: targetDir,
    metafile: true,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    splitting: true,
    loader: {
      '.js': 'jsx',
      '.css': 'local-css',
      '.entry.css': 'css'
    },
    entryNames: '[dir]/[name]-[hash]',
    inject: ['./injects-browser.js'],
    plugins: [
      kaliberConfigLoaderPlugin(),
      universalClientLoaderPlugin(),
      writeMetaFilePlugin('browser-metafile.json'),
      srcResolverPlugin()
    ]
  }
}

/** 
 * @returns {import('esbuild').Plugin}
 */
function srcResolverPlugin() {
  return {
    name: 'src-resolve-plugin',
    setup(build) {
      build.onResolve({ filter: /^\// }, async args => {
        if (args.kind === 'entry-point') return
        return build.resolve(`.${args.path}`, { kind: args.kind, resolveDir: path.resolve('./src') })
      })
    }
  }
}

function writeMetaFilePlugin(filename) {
  return {
    name: 'write-metafile-plugin',
    setup({ onEnd }) {
      onEnd(({ metafile, errors }) => {
        if (errors.length) return
        fs.writeFileSync(`./${filename}`, JSON.stringify(metafile, null, 2))
      }
      )
    }
  }
}

function getServerBuildConfig() {
  return {
    entryPoints: getEntryPoints(templateRenderers),
    preserveSymlinks: true,
    outdir: targetDir,
    metafile: true,
    bundle: true,
    platform: 'node',
    loader: {
      '.js': 'jsx',
      '.css': 'local-css',
      '.svg': 'text',
      '.svg.raw': 'text'
    },
    entryNames: '[dir]/[name]',
    format: 'cjs',
    inject: ['./injects-server.js'],
    plugins: [
      cssLoaderPlugin(),
      javascriptLoaderPlugin(),
      universalServerLoaderPlugin(),
      writeMetaFilePlugin('server-metafile.json'),
      templateRendererPlugin(templateRenderers),
      nodeExternalsPlugin(),
      srcResolverPlugin()
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
          path: args.path.replace(path.resolve(process.cwd(), 'src'), ''),
        })

        return {
          contents: newFile,
          loader: 'jsx',
        }
      })
    }
  }

  function clientSnippet({ path }) {
    console.log({ path })
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
          contents: serverSnippet({ path: args.path.replace(path.resolve(process.cwd(), 'src'), '') }),
          loader: 'jsx',
        }
      })
    }
  }

  function serverSnippet({ path }) {
    const md5 = crypto.createHash('md5').update(path).digest('hex')
    return `|import Component from '${path}?universal'
            |import { renderToString } from 'react-dom/server'
            |
            |export default function ServerComponent(props) {
            |const content = renderToString(<Component {...props} />)
            |return (
            |<div data-kaliber-component={JSON.stringify(props)} data-kaliber-component-id='${md5}' dangerouslySetInnerHTML={{ __html: content }} />
            |)
            |}`.split(/^[ \t]*\|/m).join('')
  }
}

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

function templateRendererPlugin(templateRenderers) {
  return {
    name: 'template-renderer-plugin',
    setup(build) {
      build.onEnd(({ metafile, errors }) => {
        if (errors.length) return
        const { outputs } = metafile
        const extensions = Object.keys(templateRenderers).join('|')
        Object.keys(outputs).filter(x => new RegExp(`(${extensions})\.js`).test(x)).forEach(filePath => {
          const extension = filePath.split('.').slice(-2, -1)[0]
          const { rendererFilename, filename } = getFileAndRendererInfo(filePath)
          const module = importFresh(path.resolve(targetDir, filename))

          if (typeof module.default === 'function') {
            const newFilename = filename.replaceAll(`.${extension}.js`, `.${extension}.template.js`)
            const dynamicTemplate = createDynamicTemplate(newFilename, rendererFilename)
            fs.renameSync(path.resolve(process.cwd(), 'target', filename), path.resolve(process.cwd(), 'target', newFilename))
            fs.writeFileSync(path.resolve(process.cwd(), 'target', filename), dynamicTemplate)
          } else {

            const renderer = importFresh(path.resolve(pwd, rendererFilename))
            const content = renderer(module.default)
            fs.writeFileSync(path.resolve(targetDir, filename.replace(/\.js$/, '')), content)
            fs.unlinkSync(path.resolve(targetDir, filename))
          }
        })
        console.log('Finished building')
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
  return gatherEntries(templateRenderers).map(x => path.resolve(srcDir, x))
}

function gatherEntries(templateRenderers) {
  const extensions = Object.keys(templateRenderers)
  const template = extensions.join('|')
  const globs = [`**/*.@(${template}).js`, '**/*.entry.js', '**/*.entry.css']
  return walkSync(srcDir, { globs }).reduce(
    (result, entry) => ([...result, entry]),
    []
  )
}

function createDynamicTemplate(sourceLocation, rendererLocation) {
  return `
    |const source = require('./${sourceLocation}')
    |const renderer = require('../${rendererLocation}')
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
  |function getCssBundle(entrypoint) {
  |  const metafile = JSON.parse(fs.readFileSync('./server-metafile.json'))
  |  const output = Object.values(metafile.outputs).find(x => x.entryPoint === entrypoint)
  |  return output.cssBundle.replace('target','')
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
  |export const javascript = determineScripts('${entryPoint.replace(pwd, '').slice(1)}').map((x,idx)=><script key={idx} src={x} type="module" defer></script>)
  |
  |function determineScripts(entryPoint) {
  |  const serverMetafile = JSON.parse(fs.readFileSync('./server-metafile.json'))
  |  const browserMetafile = JSON.parse(fs.readFileSync('./browser-metafile.json'))
  |
  |  const { inputs } = Object.values(serverMetafile.outputs).find(x => x.entryPoint === entryPoint)
  |  const universalInputs = Object.keys(inputs).filter(x => x.endsWith('.universal.js'))
  |  
  |  const browserEntries = Object.entries(browserMetafile.outputs)
  |  return universalInputs.map(x => {
  |     return browserEntries.find(([k, v]) => v.entryPoint === x)[0].replace('target', '')
  |  })
  |}
  `.replace(/^[ \t]*\|/gm, '')
}

function kaliberConfigLoaderPlugin() {
  return {
    name: 'kaliber-config-loader',
    setup({ onResolve }) {
      onResolve({ filter: /^@kaliber\/config/ }, (args) => {
        throw Error('Do not load kaliber config')
      })
    },
  }
}
