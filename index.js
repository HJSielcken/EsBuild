const esbuild = require('esbuild')
const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const walkSync = require('walk-sync');
const config = require('@kaliber/config')

const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

const { templateRenderers, compileWithBabel } = config

build()

const universalEntryPoints = []

async function build() {
  await buildServer().then(_ => buildClient()).catch(x => console.log(x)).finally(x => { console.log('Finished'); process.exit('1') })
  universalEntryPoints = []
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
    entryPoints: universalEntryPoints,
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
    external: ['react', 'react-dom'],
    plugins: [
      cssLoaderPlugin(),
      javascriptLoaderPlugin(),
      universalServerLoaderPlugin(),
      writeMetaFilePlugin('server-metafile.json'),
      templateRendererPlugin(templateRenderers),
      compileForServerPlugin(),
      srcResolverPlugin()
    ]
  }
}

/** 
 * @returns {import('esbuild').Plugin}
 */
function compileForServerPlugin() {
  return {
    name: 'externals-plugin',
    setup(build) {
      build.onResolve({ filter: /./ }, args => {
        const isPackage = determineIsPackage(args.path)

        if (!isPackage) return null

        if (compileWithBabel.find(x => x.test(args.path))) return null

        return {
          path: args.path, external: true
        }
      })
    }
  }
}

function determineIsPackage(path) {
  try {
    const isNodeModule = require.resolve(path).includes(`node_modules`)
    return isNodeModule
  }
  catch (e) {
    return false
  }
}

const clientSnippet = require('./react-containerless-client-loader')

function universalClientLoaderPlugin() {
  return {
    name: 'universal-loader-plugin',
    setup({ onLoad }) {
      onLoad({ filter: /\.universal.js/ }, async (args) => {
        if (args.suffix === '?universal-loaded') return
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

  // function clientSnippet({ path }) {
  //   const md5 = crypto.createHash('md5').update(path).digest('hex')

  //   return `|import ClientComponent from '${path}?universal-loaded'; 
  //           |const { hydrateRoot } = ReactDOM; 
  //           |const nodes = Array.from(document.querySelectorAll('*[data-kaliber-component-id="${md5}"]'));
  //           |nodes.map(x => {
  //           |const props = JSON.parse(x.dataset.kaliberComponent); 
  //           |const newElement = React.createElement(ClientComponent, props);
  //           |hydrateRoot(x, newElement);
  //           |})`.split(/^[ \t]*\|/m).join('').replace(/\n/g, '');
  // }
}

const serverSnippet = require('./react-containerless-server-loader')

function universalServerLoaderPlugin() {
  return {
    name: 'universal-loader-plugin',
    setup({ onLoad }) {
      onLoad({ filter: /\.universal.js/ }, async (args) => {
        if (args.suffix === '?universal-loaded') return

        universalEntryPoints.push(args.path)
        return {
          contents: serverSnippet({ path: args.path.replace(path.resolve(process.cwd(), 'src'), '') }),
          loader: 'jsx',
        }
      })
    }
  }


  // function serverSnippet({ path }) {
  //   const md5 = crypto.createHash('md5').update(path).digest('hex')
  //   return `|import Component from '${path}?universal-loaded'
  //           |import { renderToString } from 'react-dom/server'
  //           |
  //           |export default function ServerComponent(props) {
  //           |const content = renderToString(<Component {...props} />)
  //           |return (
  //           |<div data-kaliber-component={JSON.stringify(props)} data-kaliber-component-id='${md5}' dangerouslySetInnerHTML={{ __html: content }} />
  //           |)
  //           |}`.split(/^[ \t]*\|/m).join('')
  // }
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
      build.onEnd(async ({ metafile, errors }) => {
        if (errors.length) return
        const { outputs } = metafile
        const extensions = Object.keys(templateRenderers).join('|')
        await Promise.all(Object.keys(outputs).filter(x => new RegExp(`(${extensions})\.js`).test(x)).map(async filePath => {
          evalInFork(filePath)
        }))
      })
      
    }
  }
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

async function evalInFork(filePath) {
  return new Promise((resolve, reject) => {
    const js = childProcess.fork(
      path.join(__dirname, 'eval-in-fork.js'),
      [],
      { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }
    )
    const outData = []
    const errData = []
    const messageData = []
    js.on('message', x => messageData.push(x))
    js.stdout.on('data', x => outData.push(x))
    js.stderr.on('data', x => errData.push(x))
    js.on('close', code => {
      if (outData.length) console.log(outData.join(''))
      if (code === 0) {
        if (!messageData.length) reject(new Error('Execution failed, no result from eval'))
        else resolve(messageData.join(''))
      } else reject(new Error(errData.join('')))
    })

    js.send(filePath)
  })
}
