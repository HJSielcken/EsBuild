module.exports = function textRenderer(template) {
  if (typeof template !== 'string') throw new Error('txt-renderer expected a string')
    return template
}
