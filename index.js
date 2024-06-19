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

build()

async function build() {
  const r = await esbuild.build({
    entryPoints: getEntryPoints(templateRenderers),
    outdir: targetDir,
    metafile: true,
    target: 'node20',
    loader: {
      '.js': 'jsx'
    },
    entryNames: '[dir]/[name].template',
    format: 'cjs',
    plugins: [
      templateRendererPlugin()
    ]
  })
}

function templateRendererPlugin() {
  return {
    name: 'template-renderer-plugin',
    setup(build) {
      build.onEnd(({ metafile }) => {
        const { outputs } = metafile
        
        Object.keys(outputs).forEach(filePath => {
          const { rendererFilename, filename} = getFileAndRendererInfo(filePath)
          
          const module = require(path.resolve(targetDir, filename))

          if (typeof module.default === 'function') {
            const dynamicTemplate = createDynamicTemplate(filename, rendererFilename)
            const newFilename = filename.replace('template.','')
            fs.writeFileSync(newFilename, dynamicTemplate)
          } else {
            const renderer = require(path.resolve(pwd, rendererFilename))
            const content = renderer(module.default)
            fs.writeFileSync(path.resolve(targetDir, filename.replace('.template.js','')), content)
            fs.unlinkSync(path.resolve(targetDir, filename))
          }
        })
      })
    }
  }
}

function getFileAndRendererInfo(filePath) {
  const extension = filePath.split('.').toReversed()[2]
  const filename = filePath.replace('target/','')
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
