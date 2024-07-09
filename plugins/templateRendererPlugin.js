const fs = require('fs')
const childProcess = require('child_process')
const path = require('path')

module.exports = { templateRendererPlugin }

function templateRendererPlugin(templateRenderers, serverMetaFile) {
  return {
    name: 'template-renderer-plugin',
    setup(build) {
      build.onEnd(async ({ errors }) => {
        if (errors.length) return
        const content = await fs.promises.readFile(serverMetaFile)
        const metafile = JSON.parse(content)
        const { outputs } = metafile
        const extensions = Object.keys(templateRenderers).join('|')
        await Promise.all(Object.keys(outputs).filter(x => new RegExp(`(${extensions})\.js`).test(x)).map(async filePath => {
          const type = await evalInFork(filePath)
          console.log({ type, filePath })
        }))
      })

    }
  }
}

async function evalInFork(filePath) {
  return new Promise((resolve, reject) => {
    const js = childProcess.fork(
      path.resolve(__dirname, 'eval-in-fork.js'),
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
