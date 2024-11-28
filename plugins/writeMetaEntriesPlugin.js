const fs = require('fs').promises
const path = require('path')
const targetDir = path.resolve(process.cwd(), 'target')

module.exports = { writeMegaEntriesPlugin }

function writeMegaEntriesPlugin({ serverMetaFile, browserMetaFile }) {
  return {
    name: 'write-mega-entries-plugin',
    setup({ onEnd }) {
      onEnd(async () => {
        const { outputs: clientOutputs } = JSON.parse(await fs.readFile(browserMetaFile, 'utf8'))
        const { outputs: serverOutputs } = JSON.parse(await fs.readFile(serverMetaFile, 'utf8'))
        await writeCssEntries(serverOutputs)
        await writeJavascriptEntries({ serverOutputs, clientOutputs })
      }
      )
    }
  }
}


async function writeCssEntries(serverOutputs) {
  const cssEntries = Object.values(serverOutputs).reduce(
    (result, x) => {
      if (!x.entryPoint | !x.cssBundle) return result
      result[path.resolve(process.cwd(), x.entryPoint)] = { cssBundle: `/${path.relative(targetDir, x.cssBundle)}` }
      return result
    }
    ,
    {}
  )

  await fs.writeFile(path.resolve(process.cwd(), 'target', 'css-entries.json'), JSON.stringify(cssEntries))
}

async function writeJavascriptEntries({ serverOutputs, clientOutputs }) {
  const javascriptEntries = Object.values(serverOutputs).reduce(
    (result, { entryPoint, inputs }) => {
      if (!entryPoint) return result
      if (![entryPoint, `${entryPoint}?universal`].includes(entryPoint)) return result

      const universalInputs = Object.keys(inputs).filter(x => x.endsWith('.universal.js') || x.endsWith('?universal'))

      const javascriptChunks = universalInputs
        .flatMap(input => Object.entries(clientOutputs)
          .filter(([k, { entryPoint }]) => entryPoint === input)
        )
        .map(([javascriptChunk]) => '/' + path.relative(targetDir, javascriptChunk))

      result[path.resolve(process.cwd(), entryPoint)] = { javascriptChunks }
      return result
    }
    ,
    {}
  )

  await fs.writeFile(path.resolve(process.cwd(), 'target', 'javascript-entries.json'), JSON.stringify(javascriptEntries))

}
