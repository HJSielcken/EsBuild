console.log('asd')
const fs = require('fs')
const gettextParser = require('gettext-parser')

console.log(gettextParser)
console.log('gettextParserasd')
module.exports = { poLoaderPlugin }

/** @type {import('esbuild').Plugin} */
function poLoaderPlugin() {
  return {
    name: 'po-loader-plugin',
    setup(build) {
      build.onLoad({ filter: /\.po$/ }, args => {
        const content = fs.readFileSync(args.path)

        console.log(content)

        return {
          loader: 'js',
          contents: `module.exports = ${JSON.stringify(content)};`
        }
      })
    }
  }
}
