module.exports = { copyUnusedFilesPlugin }

const path = require('path')
const fs = require('fs')
const walkSync = require('walk-sync')

const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

/**
 * @returns {import('esbuild').Plugin}
 */
function copyUnusedFilesPlugin() {
  const files = new Set()
  return {
    name: 'copyUnusedFilesPlugin',
    setup({ onEnd, onStart, onLoad }) {
      onStart(() => {
        const srcFiles = walkSync(srcDir, { directories: false })
        srcFiles.forEach((file) => files.add(file))
      })
      onLoad({ filter: /./ }, (args) => {
        const targetFilePath = path.relative(srcDir, args.path)
        files.delete(targetFilePath)
      })
      onEnd(async () => {
        const filesToCopy = files.values()
        await Promise.all(
          Array.from(filesToCopy).map((file) =>
            fs.promises.cp(path.join(srcDir, file), path.join(targetDir, file), { preserveTimestamps: true })
          )
        )
        files.clear()
      })
    },
  }
}
