const { mkdirSync } = require('node:fs')
const fs = require('node:fs').promises
const path = require('node:path')
const esbuild = require('esbuild')
const nodePath = require('node:path')

module.exports = { cssServerLoaderPlugin, cssClientLoaderPlugin }

const cssClassMapLookup = {}
const cssCache = new Map()

/** @returns {import('esbuild').Plugin} */
function cssServerLoaderPlugin({ tempDir }) {
  const cssDirPath = path.resolve(tempDir, 'css')
  mkdirSync(cssDirPath, { recursive: true })

  return {
    name: 'css-server-loader-plugin',
    setup({ onLoad, onResolve }) {
      onResolve({ filter: /\.css/ }, async (args) => {
        if (args.pluginData?.localCss) return

        if (args.path.startsWith('#css')) {
          const filename = args.path.slice(5)
          return { path: nodePath.resolve(cssDirPath, filename) }
        }

        if (isGlobalImport(args)) return

        const result = { path: path.resolve(args.resolveDir || '', args.path) }

        return { ...result, pluginData: { localCss: true } }
      })

      onLoad({ filter: /\.css/ }, async (args) => {
        if (!args.pluginData?.localCss) return

        const { mtimeMs } = await fs.stat(args.path)
        const cached = cssCache.get(args.path)

        if (cached && cached.mtimeMs === mtimeMs) {
          return cached.result
        }

        const classMapKey = determineClassMapKey(args)
        const { modifiedSource, warnings } = await processCss(args.path, classMapKey)
        const classMap = createClassMap(classMapKey, modifiedSource)

        cssClassMapLookup[classMapKey] = classMap
        await fs.writeFile(path.resolve(cssDirPath, `${classMapKey}.entry.css`), modifiedSource)

        const result = {
          contents: classMapToJsWithCss(classMapKey, classMap),
          loader: 'js',
          warnings
        }

        cssCache.set(args.path, { mtimeMs, result })

        return result
      })
    }
  }
}

/** @returns {import('esbuild').Plugin} */
function cssClientLoaderPlugin() {
  return {
    name: 'css-client-loader-plugin',
    setup({ onLoad, onResolve }) {
      onResolve({ filter: /\.css/ }, async args => {
        if (args.pluginData?.localCss) return

        if (isGlobalImport(args))
          throw new Error(`Do not import global ${args.path} css in ${args.importer}`, args.path)
      })

      onLoad({ filter: /\.css/ }, async (args) => {
        const classMapKey = determineClassMapKey(args)
        const classMap = cssClassMapLookup[classMapKey]

        return { contents: classMapToJs(classMap), loader: 'js' }
      })
    }
  }
}

async function processCss(filePath, prefix) {
  const cssSource = await fs.readFile(filePath, 'utf8')
  const { code, warnings } = await esbuild.transform(cssSource, {
    sourcefile: `${prefix}.css`,
    loader: 'local-css',
    target: ['chrome94', 'opera79', 'edge94', 'firefox92', 'safari15']
  })
  return { modifiedSource: code, warnings }
}

function createClassMap(prefix, source) {
  const classMap = {}
  const regex = new RegExp(`${prefix}_([\\w]+)`, 'g')
  let match

  while ((match = regex.exec(source))) {
    const [_, className] = match
    classMap[className] = match[0]
  }

  return classMap
}

function classMapToJsWithCss(prefix, classMap) {
  return `
    import '#css/${prefix}.entry.css'
    ${classMapToJs(classMap)}
  `
}

function classMapToJs(classMap) {
  return `export default ${JSON.stringify(classMap)}`
}

function determineClassMapKey(args) {
  return path.relative(process.cwd(), args.path).replace(/\//g, '_').slice(0, -4)
}

function isGlobalImport({ path }) {
  return (!path.startsWith('/') && !path.startsWith('./') && !path.startsWith('../')) || path.endsWith('entry.css')
}
