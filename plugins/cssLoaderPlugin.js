const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')
const cssDirName = '.tempCss'
const cssDirPath = path.resolve(process.cwd(), cssDirName)

module.exports = { cssServerLoaderPlugin, cssClientLoaderPlugin, cssDirPath }

/** @type {{[prefix: string]: {modifiedTimeStamp: number, classMap: object}}} */
const cssClassMapLookup = {}

/** @returns {import('esbuild').Plugin} */
function cssServerLoaderPlugin() {
  return {
    name: 'cssServerLoader',
    setup({ onLoad, onResolve }) {
      onResolve({ filter: /\.css/ }, async (args) => {
        if (args.path.startsWith(cssDirName)) {
          const [filename] = path.basename(args.path).split('?')
          return {
            path: path.resolve(cssDirPath, filename),
            suffix: '?css-loaded'
          }
        }
      })

      onLoad({ filter: /\.css/ }, async (args) => {
        if (args.suffix === '?css-loaded') return

        const modifiedTimestamp = await getModifiedTimestamp(args)
        const prefix = determinePrefix(args)

        const cached = cssClassMapLookup[prefix]

        if (cached && cached.modifiedTimestamp === modifiedTimestamp)
          return {
            contents: classMapAsJs({ prefix, classMap }),
            loader: 'js'
          }

        const cssSource = await fs.promises.readFile(args.path, 'utf8')
        const modifiedSource = await prefixClasses(prefix, cssSource)
        const classMap = createClassMap(prefix, modifiedSource)

        cssClassMapLookup[prefix] = { classMap, modifiedTimestamp }
        await fs.promises.writeFile(path.resolve(cssDirPath, `${prefix}.entry.css`), modifiedSource)

        return {
          contents: classMapAsJs({ prefix, classMap }),
          loader: 'js'
        }
      })
    }
  }
}

function classMapAsJs({ prefix, classMap }) {
  const classMapAsJs = `
  import styles from '${cssDirName}/${prefix}.entry.css?css-loaded'
  export default ${JSON.stringify(classMap)}
  `
  return classMapAsJs
}

async function getModifiedTimestamp(args) {
  try {
    const { mtimeMs } = await fs.promises.stat(args.path)
    return mtimeMs
  } catch (e) {
    return null
  }
}

/**
 * @returns {import('esbuild').Plugin}
 */
function cssClientLoaderPlugin() {
  return {
    name: 'css-client-loader',
    setup({ onLoad }) {
      onLoad({ filter: /.css/ }, async (args) => {
        const prefix = determinePrefix(args)
        const classMapAsJs = `export default ${JSON.stringify(cssClassMapLookup[prefix].classMap)}`

        return {
          contents: classMapAsJs,
          loader: 'js'
        }
      })
    }
  }
}

async function prefixClasses(prefix, source) {
  const { code } = await esbuild.transform(source, {
    sourcefile: `${prefix}.css`,
    loader: 'local-css',
    // https://en.wikipedia.org/wiki/Timeline_of_web_browsers#2020s
    target: ['chrome94', 'opera79', 'edge94', 'firefox92', 'safari15'],
  })

  return code
}

function createClassMap(prefix, source) {
  const classRegExp = new RegExp(String.raw`${prefix}_([\w]+)`, 'g')
  const classMap = {}
  let match
  while (match = classRegExp.exec(source)) {
    const [replacement, className] = match
    classMap[className] = replacement
  }
  return classMap
}

function determinePrefix(args) {
  return path.relative('./src', args.path).replaceAll(/\//g, '_').slice(0, -4)
}
