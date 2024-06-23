const a = require('./target/aap.html.js')
const React = require('react-dom/server')

const component = a.default
const { props } = component
const element = component({title: 'Zelda'})

console.log(React.renderToStaticMarkup(element))

// const json = require('./target/aap.json.js')

// console.log(json.default({title: 'zelda'}))
