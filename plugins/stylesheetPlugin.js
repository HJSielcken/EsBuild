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
  const stylesheet = entryPoint.replace(process.cwd(), '').slice(1)
  return `
  |export const stylesheet = <link rel="stylesheet" href={getCssBundle("${stylesheet}")} />
  |function getCssBundle(entrypoint) {
  |  const metafile = JSON.parse(fs.readFileSync('./server-metafile.json'))
  |  const output = Object.values(metafile.outputs).find(x => x.entryPoint === entrypoint)
  |  return output.cssBundle.replace('target','')
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
