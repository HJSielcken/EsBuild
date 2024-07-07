module.exports = {
  templateRenderers: {
    json: 'json-renderer.js',
    html: 'html-react-renderer.js',
  },
  compileWithBabel: [
    /@kaliber\/routing/,
    /@kaliber\/use-is-mounted-ref/
  ]
}
