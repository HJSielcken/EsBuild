
const renderer = require('./html-react-renderer.js')
const source = require('./target/index.html.js')
const React = require('react')
Object.assign(render, source)

module.exports = render

function render(props) {
  return renderer(source.default(props))
}
