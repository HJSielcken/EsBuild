const { renderToString } = require(`${process.cwd()}/node_modules/react-dom/server`)

module.exports = function htmlReactRenderer(template) {
  return '<!DOCTYPE html>\n'+renderToString(template)
}
