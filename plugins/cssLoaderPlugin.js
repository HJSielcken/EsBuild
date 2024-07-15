const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

module.exports = { cssServerLoaderPlugin, cssClientLoaderPlugin }

const cssClassMapLookup = {}

/**
 * @returns {import('esbuild').Plugin}
 */
function cssServerLoaderPlugin() {
  return {
    name: 'cssServerLoader',
    setup({ onLoad, onResolve }) {
      onResolve({ filter: /\.css/ }, async (args) => {
        if (args.path.startsWith('temp_css')) {
          const [filename] = path.basename(args.path).split('?')
          return {
            path: path.resolve(process.cwd(), 'temp_css', filename)
          }
        }
      })

      onLoad({ filter: /\.css/ }, async (args) => {
        if (args.suffix === '?css-loaded') return

        const cssSource = await fs.promises.readFile(args.path, 'utf8')
        const prefix = determinePrefix(args)

        const modifiedSource = await prefixClasses(prefix, cssSource)
        const classMap = createClassMap(prefix, modifiedSource)

        cssClassMapLookup[prefix] = classMap
        await fs.promises.writeFile(path.resolve(process.cwd(), 'temp_css', `${prefix}.css`), modifiedSource)

        //   const classMapAsJs = `
        //  import styles from '/${path.relative('./src', args.path)}?css-loaded'
        //  export default ${JSON.stringify(classMap)}
        //  `

        const classMapAsJs = `
        import styles from 'temp_css/${prefix}?css-loaded'
        export default ${JSON.stringify(classMap)}
        `

        return {
          contents: classMapAsJs,
          loader: 'js'
        }

      })
    }
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
        const classMapAsJs = `export default ${JSON.stringify(cssClassMapLookup[prefix])}`

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
