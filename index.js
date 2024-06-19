const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')
const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

const templateRenderers = {
  json: 'json-renderer.js',
  html: 'html-react-renderer.js',
}

const config = getBuildConfig()

watch()

// async function build() {
//   const r = await esbuild.build(config)
// }

async function watch() {
  const ctx = await esbuild.context(config)
  await ctx.watch()
}

function getBuildConfig() {
  const config = {
    entryPoints: getEntryPoints(templateRenderers),
    outdir: targetDir,
    metafile: true,
    target: 'node20',
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
      templateRendererPlugin(),
    ]
  }
  return config
}

function cssLoaderPlugin() {
  return {
    name: 'css-loader-plugin',
    setup(build) {
      build.onResolve({ filter: /^\@kaliber\/build\/stylesheet$/ }, args => {
        return {
          path: args.path,
          namespace: 'css-loader-plugin',
          pluginData: {
            importer: args.importer
          }
        }
      })
      build.onLoad({ filter: /^\@kaliber\/build\/stylesheet$/, namespace: 'css-loader-plugin' }, args => {
        return {
          loader: 'jsx',
          contents: createStyleSheet(args.pluginData.importer)
        }
      })
    }
  }
}

function templateRendererPlugin() {
  const importFresh = require('import-fresh')
  return {
    name: 'template-renderer-plugin',
    setup(build) {
      build.onEnd(({ metafile }) => {
        fs.writeFileSync('./metafile.json', JSON.stringify(metafile, null, 2))
        const { outputs } = metafile

        Object.keys(outputs).filter(x => x.endsWith('js')).forEach(filePath => {
          const { rendererFilename, filename } = getFileAndRendererInfo(filePath)
          const module = importFresh(path.resolve(targetDir, filename))

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
  const filteredEntries = entries.filter(x => new RegExp(`[${extensions}].js$`).test(x)).map(x => path.resolve(srcDir, x))
  return filteredEntries
}

function createDynamicTemplate(sourceLocation, rendererLocation) {
  return `|const renderer = require('./${rendererLocation}')
     |const source = require('./target/${sourceLocation}')
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
  return `
  |export const stylesheet = <link rel="stylesheet" href={getCssBundle("${entryPoint.replace(pwd, '').slice(1)}")} />
  |function getCssBundle(entrypoint) {
  |  const metafile = JSON.parse(fs.readFileSync('./metafile.json'))
  |  const output = Object.values(metafile.outputs).find(x => x.entryPoint === entrypoint)
  |  return output.cssBundle.replace('target','.')
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
