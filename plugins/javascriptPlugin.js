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
 const hotReload = process.env.NODE_ENV!== 'production' && "<script dangerouslySetInnerHTML={{__html:`new EventSource('http://localhost:12345/esbuild').addEventListener('change', (x) => {console.log(x);location.reload()})` }}></script>"
  return `
  |export const javascript = determineScripts().map((x,idx)=><script key={idx} src={x} type="module" defer></script>).concat(${hotReload}).filter(Boolean)
  |
  |function determineScripts() {
  |  const javascriptEntries = JSON.parse(fs.readFileSync(process.cwd()+'/target/javascript-entries.json'))
  |  return javascriptEntries['${entryPoint}'].javascriptChunks
  |}
  `.replace(/^[ \t]*\|/gm, '')
}
