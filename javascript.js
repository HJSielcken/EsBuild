const fs = require('fs')

const browser = JSON.parse(fs.readFileSync('./browser-metafile.json'))
const server = JSON.parse(fs.readFileSync('./server-metafile.json'))

const entryPoint = 'src/aap_static.html.js'
const { inputs } = Object.values(server.outputs).find(x => x.entryPoint === entryPoint)

const universalInputs = Object.keys(inputs).filter(x => x.endsWith('.universal.js'))

console.log(universalInputs)
// console.log(universalInputs.map(x => x.replace('src', '').replace('universal', 'universal-browser')))
const a = Object.entries(browser.outputs)

console.log(
  universalInputs.map(x => {
    const entries = Object.entries(browser.outputs)
    return entries.find(([k, v]) => v.entryPoint === x)[0].replace('target', '.')
  })
)
