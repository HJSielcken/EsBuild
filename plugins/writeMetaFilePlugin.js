const fs = require('fs')
module.exports = { writeMetaFilePlugin }

function writeMetaFilePlugin(filename) {
  return {
    name: 'write-metafile-plugin',
    setup({ onEnd }) {
      onEnd(async ({ metafile, errors }) => {
        if (errors.length) return
        await fs.promises.writeFile(`./${filename}`, JSON.stringify(metafile, null, 2))
      }
      )
    }
  }
}
