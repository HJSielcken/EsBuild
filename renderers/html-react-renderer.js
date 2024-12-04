const { isElement } = require('react-is')
const { renderToStaticMarkup } = require('react-dom/server')

module.exports = function htmlReactRenderer(template) {
  if (!isElement(template)) return template
  return '<!DOCTYPE html>\n' + renderToStaticMarkup(template)
}
