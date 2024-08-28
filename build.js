const esbuild = require('esbuild')
const path = require('path')
const walkSync = require('walk-sync')
const fs = require('fs')
const config = require('@kaliber/config')

const pwd = process.cwd()
const srcDir = path.resolve(pwd, 'src')
const targetDir = path.resolve(pwd, 'target')

const templateRenderers = require('./renderers/renderers')
const { compileWithBabel } = config.kaliber

const BROWSER_META = 'browser-metafile.json'
const SERVER_META = 'server-metafile.json'

module.exports = { build, watch }

async function build() {
  try {
    await prepareFileSystem()
    const config = getServerBuildConfig()
    await esbuild.build(config)
  } catch (e) {
    console.error(e)
  }
}

async function watch() {
  try {
    await prepareFileSystem()
    const context = await esbuild.context(getServerBuildConfig({ watch: true }))
    await context.watch().then(_ => console.log('Watching for changes'))
    await context.serve({ port: 12345 })
  } catch (e) {
    console.log(e)
  }
}

async function prepareFileSystem() {
  await fs.promises.rm(targetDir, { recursive: true, force: true })
  await fs.promises.rm(cssDirPath, { recursive: true, force: true })
  await fs.promises.mkdir(cssDirPath)
}

const { poLoaderPlugin } = require('./plugins/poLoaderPlugin.js')
const { writeMetaFilePlugin } = require('./plugins/writeMetaFilePlugin')
const { srcResolverPlugin } = require('./plugins/srcResolvePlugin')
const { isInternalModulePlugin } = require('./plugins/isInternalModulePlugin')
const { compileForServerPlugin } = require('./plugins/compileForServerPlugin')
const { universalClientPlugin, universalServerPlugin } = require('./plugins/universalPlugin')
const { stylesheetPlugin } = require('./plugins/stylesheetPlugin')
const { javascriptPlugin } = require('./plugins/javascriptPlugin')
const { kaliberConfigLoaderPlugin } = require('./plugins/kaliberConfigLoaderPlugin')
const { templateRendererPlugin } = require('./plugins/templateRendererPlugin')
const { cssServerLoaderPlugin, cssClientLoaderPlugin, cssDirPath } = require('./plugins/cssLoaderPlugin.js');
const { writeMegaEntriesPlugin } = require('./plugins/writeMetaEntriesPlugin.js');
const { copyUnusedFilesPlugin } = require('./plugins/copyUnusedFilesPlugin.js')

const isProduction = process.env.NODE_ENV === 'production'

/** @returns {import('esbuild').BuildOptions}*/
function getServerBuildConfig({ watch } = {}) {
  return {
    minify: isProduction,
    entryPoints: gatherEntries(),
    preserveSymlinks: true,
    outdir: targetDir,
    metafile: true,
    bundle: true,
    platform: 'node',
    loader: {
      '.js': 'jsx',
      '.entry.css': 'global-css',
      '.raw.svg': 'text',
      '.svg': 'copy',
      '.woff2': 'file',
      '.woff': 'file',
      '.ttf': 'file',
    },
    define: {
      'process.env.CONFIG_ENV': `"${process.env.CONFIG_ENV}"`
    },
    entryNames: '[dir]/[name]',
    format: 'cjs',
    inject: ['@kaliber/esbuild/injects/server.js'],
    external: ['react', 'react-dom'],
    plugins: [
      copyUnusedFilesPlugin(),
      srcResolverPlugin(),
      cssServerLoaderPlugin(),
      stylesheetPlugin(),
      javascriptPlugin(),
      universalServerPlugin(entryPoints => getClientBuildConfig({ watch, entryPoints })),
      poLoaderPlugin(),
      writeMetaFilePlugin(SERVER_META),
      compileForServerPlugin(compileWithBabel),
      isInternalModulePlugin(),
      writeMegaEntriesPlugin({ serverMetaFile: SERVER_META, browserMetaFile: BROWSER_META }),
      templateRendererPlugin(templateRenderers, SERVER_META),
    ]
  }
}

/** @returns {import('esbuild').BuildOptions}*/
function getClientBuildConfig({ entryPoints, watch }) {
  return {
    watch,
    minify: isProduction,
    entryPoints,
    preserveSymlinks: true,
    outdir: targetDir,
    metafile: true,
    bundle: true,
    format: 'esm',
    define: {
      'process.env.CONFIG_ENV': `"${process.env.CONFIG_ENV}"`

    },
    platform: 'browser',
    external: ['stream'], //Tree shaking does not work very well I think and import createSitemapEntries from @kaliber/sanity-routing (that uses xml, that uses stream)
    splitting: true,
    loader: {
      '.js': 'jsx',
      '.entry.css': 'global-css',
      '.raw.svg': 'text',
      '.svg': 'copy',
      '.woff2': 'file',
      '.woff': 'file',
      '.ttf': 'file',
    },
    entryNames: '[dir]/[name]-[hash]',
    inject: ['@kaliber/esbuild/injects/browser.js'],
    plugins: [
      srcResolverPlugin(),
      cssClientLoaderPlugin(),
      kaliberConfigLoaderPlugin(),
      writeMetaFilePlugin(BROWSER_META),
      universalClientPlugin(),
      poLoaderPlugin(),
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
