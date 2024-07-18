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

const path = require('path')
function createStyleSheet(entryPoint) {
  const stylesheet = path.relative(process.cwd(), entryPoint)
  return `
  |export const stylesheet = <link rel="stylesheet" href={getCssBundle("${stylesheet}")} />
  |function getCssBundle(entrypoint) {
  |  const metafile = JSON.parse(fs.readFileSync(process.cwd()+'/server-metafile.json'))
  |  const output = Object.values(metafile.outputs).find(x => x.entryPoint === entrypoint)
  |  return output.cssBundle.replace('target','')
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
