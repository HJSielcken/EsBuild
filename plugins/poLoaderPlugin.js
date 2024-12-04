const fs = require('fs')

module.exports = { poLoaderPlugin }

const cache = {}

async function getPoParser() {
  const getTextParser = await import('gettext-parser')
  return getTextParser.po.parse
}

/** @returns {import('esbuild').Plugin} */
function poLoaderPlugin() {
  return {
    name: 'po-loader-plugin',
    setup(build) {
      build.onLoad({ filter: /\.po$/ }, async args => {
        const modifiedTimestamp = await getModifiedTimestamp(args)
        const isCached = cache[args.path] && (cache[args.path]?.modifiedTimestamp === modifiedTimestamp)
        if (isCached) 
          return {
            loader: 'js',
            contents: cache[args.path].contents
          }

        const poParser = await getPoParser()
        const contents = `export default ${JSON.stringify(poParser(await fs.promises.readFile(args.path)))}`

        cache[args.path] = {
          modifiedTimestamp,
          contents
        }

        return {
          loader: 'js',
          contents
        }
      })
    }
  }
}

async function getModifiedTimestamp(args) {
  try {
    const { mtimeMs } = await fs.promises.stat(args.path)
    return mtimeMs
  } catch (e) {
    return null
  }
}
