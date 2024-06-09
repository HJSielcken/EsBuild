const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')
const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

const entries = fs.readdirSync(srcDir)

const templateRenderers = {
  json: 'json-renderer.js',
  html: 'html-react-renderer.js',
}

Object.entries(templateRenderers).map((
  [ext, render]) => {
  const filteredEntries = entries.filter(x => new RegExp(`${ext}.js`).test(x))
  filteredEntries.map(x => {
    const fileLocation = path.resolve(srcDir, x)
    const rendererLocation = path.resolve(pwd, render)

    const renderer = require(rendererLocation)

    const fileContent = fs.readFileSync(fileLocation).toString()
    const { code } = esbuild.transformSync(fileContent, { loader: 'jsx', platform: 'node', format: 'cjs' })

    const transformedFilename = `${x.split('.')[0]}.${ext}.rendered.js`
    const transformedFileLocation = path.resolve(srcDir, transformedFilename)

    fs.writeFileSync(transformedFileLocation, code)
    const result = require(transformedFileLocation)

    if (typeof result.default === 'function') {
      const dynamicTemplate = createDynamicTemplate(transformedFileLocation, rendererLocation)

      const random = Math.floor(Math.random() * 1000)
      fs.writeFileSync(`${random}.js`, dynamicTemplate)

      const test = require(`./${random}`)
      console.log(test({ title: 'zeemeeuw' }))

      fs.unlinkSync(`./${random}.js`)
    } else {
      console.log(renderer(result.default))
    }
    fs.unlinkSync(transformedFileLocation)
  })
})

function createDynamicTemplate(sourceLocation, rendererLocation) {
  return `|const renderer = require('${rendererLocation}')
     |const source = require('${sourceLocation}')
     |Object.assign(render, source)
     |
     |module.exports = render
     |
     |function render(props) {
     |  return renderer(source.default(props))
     |}
     |`.replace(/^[ \t]*\|/gm, '')
}
