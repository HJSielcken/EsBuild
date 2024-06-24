const { renderToString } = require('react-dom/server')

module.exports = function htmlReactRenderer(template) {
  return '<!DOCTYPE html>\n'+renderToString(template)
}
