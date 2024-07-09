const modulePackage = require('module')

module.exports = { isInternalModulePlugin }

/** 
 * @returns {import('esbuild').Plugin}
 */
function isInternalModulePlugin() {
  return {
    name: 'internal-modules-plugin',
    setup(build) {
      build.onResolve({ filter: /./ }, args => {

        const isInternalModule = modulePackage.builtinModules.includes(args.path)

        if (!isInternalModule) return null

        return {
          path: args.path, external: true
        }
      })
    }
  }
}
