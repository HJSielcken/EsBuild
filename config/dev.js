module.exports = {
  kaliber: {
    templateRenderers: {
      json: 'json-renderer.js',
      html: 'html-react-renderer.js',
    },
    universal: {
      serverWrapper: '/wrappers/Server',
      clientWrapper: '/wrappers/Client',
    },
    compileWithBabel: [
      /@kaliber\/routing/,
      /@kaliber\/use-is-mounted-ref/,
      /@kaliber\/safe-json-stringify/
    ]
  }
}
