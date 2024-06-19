const renderer = require('./html-react-renderer.js')
const source = require('./target/aap.html.js')
Object.assign(render, source)

module.exports = render

function render(props) {
  return renderer(source.default(props))
}
