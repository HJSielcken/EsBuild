const fs = require('fs')
module.exports = { writeMetaFilePlugin }

function writeMetaFilePlugin(filename) {
  return {
    name: 'write-metafile-plugin',
    setup({ onEnd }) {
      onEnd(({ metafile, errors }) => {
        if (errors.length) return
        fs.writeFileSync(`./${filename}`, JSON.stringify(metafile, null, 2))
      }
      )
    }
  }
}
