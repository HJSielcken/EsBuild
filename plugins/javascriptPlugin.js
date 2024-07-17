module.exports = { javascriptPlugin }

function javascriptPlugin() {
  return {
    name: 'javascript-plugin',
    setup(build) {
      build.onResolve({ filter: /^\@kaliber\/esbuild\/javascript$/ }, args => {
        return {
          path: args.path,
          namespace: args.importer,
        }
      })
      build.onLoad({ filter: /^\@kaliber\/esbuild\/javascript$/ }, args => {
        return {
          loader: 'jsx',
          contents: createScriptTags(args.namespace)
        }
      })
    }
  }
}

function createScriptTags(entryPoint) {
  return `
  |export const javascript = determineScripts('${entryPoint.replace(process.cwd(), '').slice(1)}').map((x,idx)=><script key={idx} src={x} type="module" defer></script>)
  |
  |function determineScripts(entryPoint) {
  |  const serverMetafile = JSON.parse(fs.readFileSync('./server-metafile.json'))
  |  const browserMetafile = JSON.parse(fs.readFileSync('./browser-metafile.json'))
  |  console.log({serverMetafile})
  |  console.log({browserMetafile})
  |
  |  const { inputs } = Object.values(serverMetafile.outputs).find(x => x.entryPoint === entryPoint)
  |  const universalInputs = Object.keys(inputs).filter(x => x.endsWith('.universal.js'))
  |  
  |  const browserEntries = Object.entries(browserMetafile.outputs)
  |  return universalInputs.map(x => {
  |     return browserEntries.find(([k, v]) => v.entryPoint === x)[0].replace('target', '')
  |  })
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
