
const renderer = require('./json-renderer.js')
const source = require('./target/aap.json.js')
Object.assign(render, source)

module.exports = render

function render(props) {
  return renderer(source.default(props))
}
