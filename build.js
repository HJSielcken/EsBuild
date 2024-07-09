const esbuild = require('esbuild')
const path = require('path')
const walkSync = require('walk-sync');
const config = require('@kaliber/config')

const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

const templateRenderers = require('./renderers/renderers')
const { compileWithBabel } = config.kaliber

const BROWSER_META = 'browser-metafile.json'
const SERVER_META = 'server-metafile.json'

module.exports = build

async function build() {
  await buildServer()
    .then(_ => buildClient())
    .catch(x => console.log(x))
    .finally(_ => {
      universalEntryPointUtils().clearUniversalEntryPoints();
      console.log('Finished');
    })
}

async function buildServer() {
  const config = getServerBuildConfig()
  await esbuild.build(config)
}

async function buildClient() {
  const config = getClientBuildConfig()
  await esbuild.build(config)
}

const { poLoaderPlugin } = require('./plugins/poLoaderPlugin.js')
const { writeMetaFilePlugin } = require('./plugins/writeMetaFilePlugin')
const { srcResolverPlugin } = require('./plugins/srcResolvePlugin')
const { isInternalModulePlugin } = require('./plugins/isInternalModulePlugin')
const { compileForServerPlugin } = require('./plugins/compileForServerPlugin')
const { universalClientPlugin, universalServerPlugin, universalEntryPointUtils } = require('./plugins/universalPlugin')
const { stylesheetPlugin } = require('./plugins/stylesheetPlugin')
const { javascriptPlugin } = require('./plugins/javascriptPlugin')
const { kaliberConfigLoaderPlugin } = require('./plugins/kaliberConfigLoaderPlugin')
const { templateRendererPlugin } = require('./plugins/templateRendererPlugin')

console.log(poLoaderPlugin)

function getServerBuildConfig() {
  return {
    entryPoints: gatherEntries(),
    preserveSymlinks: true,
    outdir: targetDir,
    metafile: true,
    bundle: true,
    platform: 'node',
    loader: {
      '.js': 'jsx',
      '.css': 'local-css',
      '.entry.css': 'css',
      '.svg': 'text',
      '.svg.raw': 'text',
    },
    entryNames: '[dir]/[name]',
    format: 'cjs',
    inject: ['@kaliber/esbuild/injects/server.js'],
    external: ['react', 'react-dom'],
    plugins: [
      stylesheetPlugin(),
      javascriptPlugin(),
      universalServerPlugin(),
      srcResolverPlugin(),
      poLoaderPlugin(),
      writeMetaFilePlugin(SERVER_META),
      compileForServerPlugin(compileWithBabel),
      isInternalModulePlugin(),
    ]
  }
}

function getClientBuildConfig() {
  return {
    entryPoints: universalEntryPointUtils().getUniversalEntryPoints(),
    preserveSymlinks: true,
    outdir: targetDir,
    metafile: true,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    splitting: true,
    loader: {
      '.js': 'jsx',
      '.css': 'local-css',
      '.entry.css': 'css',
      '.svg': 'text',
      '.svg.raw': 'text',
    },
    entryNames: '[dir]/[name]-[hash]',
    inject: ['@kaliber/esbuild/injects/browser.js'],
    plugins: [
      kaliberConfigLoaderPlugin(),
      universalClientPlugin(),
      writeMetaFilePlugin(BROWSER_META),
      srcResolverPlugin(),
      isInternalModulePlugin(),
      templateRendererPlugin(templateRenderers, SERVER_META),
    ]
  }
}

function gatherEntries() {
  const extensions = Object.keys(templateRenderers)
  const template = extensions.join('|')
  const globs = [`**/*.@(${template}).js`, '**/*.entry.js', '**/*.entry.css']
  return walkSync(srcDir, { globs }).reduce(
    (result, entry) => ([...result, entry]),
    []
  ).map(x => path.resolve(srcDir, x))
}
