const fs = require('fs')
const path = require('path')

module.exports = { writeMetaFilePlugin }

function writeMetaFilePlugin(filename) {
  return {
    name: 'write-metafile-plugin',
    setup({ onEnd }) {
      onEnd(async ({ metafile, errors }) => {
        if (errors.length) return
        await fs.promises.writeFile(path.resolve(process.cwd(), filename), JSON.stringify(metafile, null, 2))
      }
      )
    }
  }
}
