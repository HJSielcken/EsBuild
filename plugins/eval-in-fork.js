const fs = require('fs')
const path = require('path')
const templateRenderers = require('../renderers/renderers')

const pwd = process.cwd()
const targetDir = path.resolve(pwd, 'target')

attempt(() => {
  process.on('message', handleMessage)

  function handleMessage(filePath) {
    attempt(() => {
      process.off('message', handleMessage)

      const result = createStaticOrDynamicTemplate(filePath)

      process.send(result, e =>
        attempt(() => {
          if (e) throw e
          else process.exit()
        })
      )
    })
  }
})

function createStaticOrDynamicTemplate(filePath) {
  const filename = path.basename(filePath)
  const extension = getExtensionFromTemplate(filePath)
  const module = require(path.resolve(filePath))

  
  if (typeof module.default === 'function') {
    const newFilename = filename.replaceAll(`.${extension}.js`, `.${extension}.template.js`)
    const dynamicTemplate = createDynamicTemplate(newFilename, templateRenderers[extension])
    fs.renameSync(path.resolve(process.cwd(), 'target', filename), path.resolve(process.cwd(), 'target', newFilename))
    fs.writeFileSync(path.resolve(process.cwd(), 'target', filename), dynamicTemplate)
    return `dynamic`
  } else {
    const renderer = require(templateRenderers[extension])
    const content = renderer(module.default)
    fs.writeFileSync(path.resolve(targetDir, filename.replace(/\.js$/, '')), content)
    fs.unlinkSync(path.resolve(targetDir, filename))
    return `static`
  }
}

function attempt(f) {
  try {
    f()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

function createDynamicTemplate(sourceLocation, rendererLocation) {
  return `
    |const source = require('./${sourceLocation}')
    |const renderer = require('${rendererLocation}')
    |Object.assign(render, source)
    |
    |module.exports = render
    |
    |function render(props) {
    |  return renderer(source.default(props))
    |}
    |`.replace(/^[ \t]*\|/gm, '')
}

function getExtensionFromTemplate(filePath) {
  const withoutJs = filePath.replace(/.js$/, '')
  const extension = path.extname(withoutJs).slice(1)
  return extension
}
