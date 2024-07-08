const fs = require('fs')
const path = require('path')
const { templateRenderers } = require('@kaliber/config').kaliber

const pwd = process.cwd()
const targetDir = path.resolve(pwd, 'target')

attempt(() => {
  process.on('message', handleMessage)

  function handleMessage(filePath) {
    attempt(() => {
      let result = null
      process.off('message', handleMessage)
      const { rendererFilename, filename } = getFileAndRendererInfo(filePath)
      const extension = filePath.split('.').slice(-2, -1)[0]
      const module = require(path.resolve(filePath))

      if (typeof module.default === 'function') {
        const newFilename = filename.replaceAll(`.${extension}.js`, `.${extension}.template.js`)
        const dynamicTemplate = createDynamicTemplate(newFilename, rendererFilename)
        fs.renameSync(path.resolve(process.cwd(), 'target', filename), path.resolve(process.cwd(), 'target', newFilename))
        fs.writeFileSync(path.resolve(process.cwd(), 'target', filename), dynamicTemplate)
        result = `dynamic`
      } else {
        const renderer = require(path.resolve(pwd, rendererFilename))
        const content = renderer(module.default)
        fs.writeFileSync(path.resolve(targetDir, filename.replace(/\.js$/, '')), content)
        fs.unlinkSync(path.resolve(targetDir, filename))
        result = `static`
      }

      process.send(result, e =>
        attempt(() => {
          if (e) throw e
          else process.exit()
        })
      )
    })
  }
})

function attempt(f) {
  try {
    f()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

function getFileAndRendererInfo(filePath) {
  const extension = filePath.split('.').toReversed()[1]
  const filename = filePath.replace('target/', '')
  const rendererFilename = templateRenderers[extension]
  return { rendererFilename, filename }
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
