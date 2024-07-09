const fs = require('fs')
const gettextParser = require('gettext-parser')

module.exports = { poLoaderPlugin }

/** @type {import('esbuild').Plugin} */
function poLoaderPlugin() {
  return {
    name: 'po-loader-plugin',
    setup(build) {
      build.onLoad({ filter: /\.po$/ }, async args => {
        const content = await fs.promises.readFile(args.path)

        return {
          loader: 'json',
          contents: JSON.stringify(gettextParser.po.parse(content))
        }
      })
    }
  }
}
