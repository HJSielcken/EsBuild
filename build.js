const esbuild = require('esbuild')
const path = require('path')
const walkSync = require('walk-sync');
const fs = require('fs')
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
  try {
    await prepareFileSystem()
    await buildServer()
    await buildClient()
  } catch (e) {
    console.error(e)
  } finally {
    universalEntryPointUtils().clearUniversalEntryPoints()
  }
}

async function buildServer() {
  const config = getServerBuildConfig()
  await esbuild.build(config)
}

async function buildClient() {
  const config = getClientBuildConfig()
  await esbuild.build(config)
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
const { universalClientPlugin, universalServerPlugin, universalEntryPointUtils } = require('./plugins/universalPlugin')
const { stylesheetPlugin } = require('./plugins/stylesheetPlugin')
const { javascriptPlugin } = require('./plugins/javascriptPlugin')
const { kaliberConfigLoaderPlugin } = require('./plugins/kaliberConfigLoaderPlugin')
const { templateRendererPlugin } = require('./plugins/templateRendererPlugin')
const { cssServerLoaderPlugin, cssClientLoaderPlugin, cssDirPath } = require('./plugins/cssLoaderPlugin.js')

const isProduction = process.env.NODE_ENV === 'production'

/**
 * @returns {import('esbuild').BuildOptions}
 */
function getServerBuildConfig() {
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
      '.entry.css': 'css',
      '.svg': 'text',
      '.svg.raw': 'text',
      '.woff2': 'file'
    },
    entryNames: '[dir]/[name]',
    format: 'cjs',
    inject: ['@kaliber/esbuild/injects/server.js'],
    external: ['react', 'react-dom'],
    plugins: [
      srcResolverPlugin(),
      cssServerLoaderPlugin(),
      stylesheetPlugin(),
      javascriptPlugin(),
      universalServerPlugin(),
      poLoaderPlugin(),
      writeMetaFilePlugin(SERVER_META),
      compileForServerPlugin(compileWithBabel),
      isInternalModulePlugin(),
    ]
  }
}

/**
 * @returns {import('esbuild').BuildOptions}
 */
function getClientBuildConfig() {
  return {
    minify: isProduction,
    entryPoints: universalEntryPointUtils().getUniversalEntryPoints(),
    preserveSymlinks: true,
    outdir: targetDir,
    metafile: true,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    external: ['stream'], //Tree shaking does not work and import createSitemapEntries from @kaliber/sanity-routing (that uses xml, that uses stream)
    splitting: true,
    loader: {
      '.js': 'jsx',
      '.svg': 'text',
      '.svg.raw': 'text',
      '.woff2': 'file'
    },
    entryNames: '[dir]/[name]-[hash]',
    inject: ['@kaliber/esbuild/injects/browser.js'],
    plugins: [
      srcResolverPlugin(),
      cssClientLoaderPlugin(),
      kaliberConfigLoaderPlugin(),
      universalClientPlugin(),
      writeMetaFilePlugin(BROWSER_META),
      poLoaderPlugin(),
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
