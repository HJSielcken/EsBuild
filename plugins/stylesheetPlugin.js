const path = require('path')

module.exports = { stylesheetPlugin }

function stylesheetPlugin() {
  return {
    name: 'stylesheet-plugin',
    setup(build) {
      build.onResolve({ filter: /^\@kaliber\/esbuild\/stylesheet$/ }, args => {
        return {
          path: args.path,
          namespace: args.importer,
        }
      })
      build.onLoad({ filter: /^\@kaliber\/esbuild\/stylesheet$/ }, args => {
        return {
          loader: 'jsx',
          contents: createStyleSheet(args.namespace)
        }
      })
    }
  }
}

function createStyleSheet(entryPoint) {
  const stylesheet = path.relative(process.cwd(), entryPoint)
  return `
  |export const stylesheet = <link rel="stylesheet" href={getCssBundle()} />
  |function getCssBundle() {
  |  const metafile = JSON.parse(fs.readFileSync(process.cwd()+'/target/css-entries.json'))
  |  return metafile['${entryPoint}'].cssBundle
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
