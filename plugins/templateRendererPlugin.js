const fs = require('fs')
const childProcess = require('child_process')
const path = require('path')
const templateRenderers = require('../renderers/renderers')

module.exports = { templateRendererPlugin }

const cache = {}

/** @returns {import('esbuild').Plugin} */
function templateRendererPlugin(templateRenderers, serverMetaFile) {
  return {
    name: 'template-renderer-plugin',
    setup(build) {
      build.onEnd(async ({ errors }) => {
        if (errors.length) return
        const content = await fs.promises.readFile(serverMetaFile, 'utf8')
        const metafile = JSON.parse(content)
        const { outputs } = metafile
        
        const extensions = Object.keys(templateRenderers).join('|')
        await Promise.all(Object.keys(outputs).filter(x => new RegExp(`(${extensions})\.js`).test(x)).map(async targetFilepath => {
          const filename = path.basename(targetFilepath)
          const extension = getExtensionFromTemplate(filename)
          const filepath = path.resolve(process.cwd(), targetFilepath)

          const size = await getSize(filepath)
          const cached = cache[filepath] && cache[filepath].size === size

          if (cached) {
            console.log(`cached ${filepath}`)
            return
          }
          
          cache[filepath] = { size }

          const isDynamicTemplate = await determineIfTemplateIsDynamic(targetFilepath)
          if (isDynamicTemplate) {
            await createDynamicTemplate({ targetFilepath, extension })
            console.log({ type: 'dynamic', filename })
          } else {
            await createStaticTemplate({ filepath: targetFilepath, extension })
            console.log({ type: 'static', filename })
          }
        }))
      })

    }
  }
}

async function getSize(filepath) {
  try {
    const { size } = await fs.promises.stat(filepath)
    return size
  } catch (e) {
    return null
  }
}

async function createDynamicTemplate({ targetFilepath, extension }) {
  const newTargetFilepath = targetFilepath.replaceAll(`.${extension}.js`, `.${extension}.template.js`)
  const dynamicTemplate = createDynamicTemplateSnippet(newTargetFilepath, templateRenderers[extension])
  await fs.promises.rename(path.resolve(process.cwd(), targetFilepath), path.resolve(process.cwd(), newTargetFilepath))
  await fs.promises.writeFile(path.resolve(process.cwd(), targetFilepath), dynamicTemplate)
}

async function determineIfTemplateIsDynamic(targetFilepath) {
  const srcFilePath = path.resolve(process.cwd(), targetFilepath.replace(/^target\//, 'src/'))
  const filecontent = (await fs.promises.readFile(srcFilePath)).toString()

  return /(export default function)|(export default async function)/.test(filecontent)
}

function getExtensionFromTemplate(filepath) {
  const withoutJs = filepath.replace(/.js$/, '')
  const extension = path.extname(withoutJs).slice(1)
  return extension
}

function createDynamicTemplateSnippet(targetFilepath, rendererLocation) {
  return `
    |const path = require('path')
    |const envRequire = process.env.NODE_ENV==='production' ? require : require('import-fresh')
    |const source = envRequire(path.resolve(process.cwd(), '${targetFilepath}'))
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

async function createStaticTemplate({ filepath, extension }) {
  return new Promise((resolve, reject) => {
    const js = childProcess.fork(
      path.resolve(__dirname, 'create-static-template.js'),
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

    js.send(JSON.stringify({ filepath, extension }))
  })
}
