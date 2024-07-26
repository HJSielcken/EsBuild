const path = require('path')
module.exports = { compileForServerPlugin }

/** 
 * @returns {import('esbuild').Plugin}
 */
function compileForServerPlugin(compileWithBabel) {
  return {
    name: 'compileForServerPlugin',
    setup(build) {
      build.onResolve({ filter: /./ }, async args => {
        if (args.pluginData?.resolvedByCompileForServerPlugin) return null
        if (args.path.includes('@kaliber/esbuild')) return null
        
        const result = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: {
            resolvedByCompileForServerPlugin: true
          }
        })

        const isPackage = path.relative(process.cwd(), result.path).startsWith('node_modules')

        if (!isPackage) return null

        if (compileWithBabel.find(x => x.test(result.path))) return null

        return {
          path: args.path, external: true
        }
      })
    }
  }
}
