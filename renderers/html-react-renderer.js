const { isElement } = require('react-is')
const { renderToString } = require(`${process.cwd()}/node_modules/react-dom/server`)

module.exports = function htmlReactRenderer(template) {
  if (!isElement(template)) return template
  return '<!DOCTYPE html>\n' + renderToString(template)
}
