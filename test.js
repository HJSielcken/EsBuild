const a = require('./target/aap.html.template')
const React = require('react-dom/server')

const component = a.default
const { props } = component
const element = component(props)

  // console.log(m(m.check))
console.log(React.renderToStaticMarkup(element))
