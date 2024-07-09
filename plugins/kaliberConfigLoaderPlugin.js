module.exports = { kaliberConfigLoaderPlugin }

function kaliberConfigLoaderPlugin() {
  return {
    name: 'kaliber-config-loader',
    setup({ onResolve }) {
      onResolve({ filter: /^@kaliber\/config/ }, (args) => {
        throw Error('Do not load kaliber config')
      })
    },
  }
}
