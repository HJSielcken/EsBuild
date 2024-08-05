const fs = require('fs')
const path = require('path')
const templateRenderers = require('../renderers/renderers')

const pwd = process.cwd()
const targetDir = path.resolve(pwd, 'target')

attempt(() => {
  process.on('message', handleMessage)

  function handleMessage(message) {
    const { filepath, extension } = JSON.parse(message)
    attempt(() => {
      process.off('message', handleMessage)

      const result = createStaticTemplate({ filepath, extension })

      process.send(result, e =>
        attempt(() => {
          if (e) throw e
          else process.exit()
        })
      )
    })
  }
})

function createStaticTemplate({ filepath, extension }) {
  const module = require(path.resolve(filepath))
  const renderer = require(templateRenderers[extension])

  const content = renderer(module.default)
  fs.writeFileSync(path.resolve(process.cwd(), filepath.replace(/\.js$/, '')), content)
  fs.unlinkSync(path.resolve(process.cwd(), filepath))

  return `static`
}

function attempt(f) {
  try {
    f()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
