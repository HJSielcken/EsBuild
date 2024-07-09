module.exports = { compileForServerPlugin }

/** 
 * @returns {import('esbuild').Plugin}
 */
function compileForServerPlugin(compileWithBabel) {
  return {
    name: 'externals-plugin',
    setup(build) {
      build.onResolve({ filter: /./ }, args => {
        const isPackage = determineIsPackage(args.path)
        if (!isPackage) return null

        if (compileWithBabel.find(x => x.test(args.path))) return null

        return {
          path: args.path, external: true
        }
      })
    }
  }
}

function determineIsPackage(path) {
  try {
    const isNodeModule = require.resolve(path).includes(`node_modules`)
    return isNodeModule
  }
  catch (e) {
    return false
  }
}
