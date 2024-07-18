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
 const hotReload = process.env.NODE_ENV!== 'production' && "<script dangerouslySetInnerHTML={{__html:`new EventSource('http://localhost:12345/esbuild').addEventListener('change', (x) => console.log(x);location.reload())` }}></script>"

  return `
  |export const javascript = determineScripts('${entryPoint.replace(process.cwd(), '').slice(1)}').map((x,idx)=><script key={idx} src={x} type="module" defer></script>).concat(${hotReload}).filter(Boolean)
  |
  |function determineScripts(entryPoint) {
  |  const serverMetafile = JSON.parse(fs.readFileSync(process.cwd()+'/server-metafile.json'))
  |  const browserMetafile = JSON.parse(fs.readFileSync(process.cwd()+'/browser-metafile.json'))
  |
  |  const { inputs } = Object.values(serverMetafile.outputs).find(x => x.entryPoint === entryPoint ||  x.entryPoint === entryPoint+'?universal')
  |  const universalInputs = Object.keys(inputs).filter(x => x.endsWith('.universal.js') ||  x.endsWith('?universal'))
  |  
  |  const browserEntries = Object.entries(browserMetafile.outputs)
  |  return universalInputs.map(x => {
  |     return browserEntries.find(([k, v]) => v.entryPoint === x)[0].replace('target', '')
  |  })
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
