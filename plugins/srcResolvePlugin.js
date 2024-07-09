const path = require('path')
module.exports = { srcResolverPlugin }

/** 
 * @returns {import('esbuild').Plugin}
 */
function srcResolverPlugin() {
  return {
    name: 'src-resolve-plugin',
    setup(build) {
      build.onResolve({ filter: /^\// }, args => {
        if (args.kind === 'entry-point') return
        return build.resolve(`.${args.path}`, { kind: args.kind, resolveDir: path.resolve('./src') })
      })
    }
  }
}
