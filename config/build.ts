import { watch } from 'fs'
import { join, resolve } from 'path'
import autoprefixer from 'autoprefixer'
import { cp, mkdir, readdir, rm } from 'fs/promises'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const isWatch = process.argv.includes('--watch')
const rootDir = resolve(import.meta.dir, '..')
const srcDir = join(rootDir, 'src')
const publicDir = join(rootDir, 'public')
const distDir = join(rootDir, 'dist')

async function clean() {
  await rm(distDir, { recursive: true, force: true })
  await mkdir(distDir, { recursive: true })
}

async function copyPublic() {
  const files = await readdir(publicDir)
  for (const file of files) {
    await cp(join(publicDir, file), join(distDir, file), { recursive: true })
  }
}

async function buildCSS() {
  const cssPath = join(srcDir, 'styles', 'globals.css')
  const cssFile = Bun.file(cssPath)

  if (!(await cssFile.exists())) {
    console.log('No globals.css found, skipping CSS build')
    return
  }

  const css = await cssFile.text()
  const result = await postcss([
    tailwindcss(join(rootDir, 'tailwind.config.js')),
    autoprefixer,
  ]).process(css, { from: cssPath })

  await Bun.write(join(distDir, 'styles.css'), result.css)
}

async function buildTS(entrypoints: string[]) {
  const result = await Bun.build({
    entrypoints,
    outdir: distDir,
    target: 'browser',
    format: 'esm',
    splitting: false,
    minify: !isWatch,
    sourcemap: isWatch ? 'inline' : 'none',
  })

  if (!result.success) {
    console.error('Build failed:')
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }
}

async function build() {
  console.log('Building...')
  const start = performance.now()

  await clean()
  await copyPublic()

  const entrypoints = [
    join(srcDir, 'popup', 'index.tsx'),
    join(srcDir, 'background', 'index.ts'),
  ]

  // Check if content script exists
  const contentPath = join(srcDir, 'content', 'index.ts')
  if (await Bun.file(contentPath).exists()) {
    entrypoints.push(contentPath)
  }

  await buildTS(entrypoints)
  await buildCSS()

  const elapsed = (performance.now() - start).toFixed(0)
  console.log(`Built in ${elapsed}ms`)
}

await build()

if (isWatch) {
  console.log('Watching for changes...')

  const watcher = watch(
    srcDir,
    { recursive: true },
    async (event, filename) => {
      if (filename) {
        console.log(`\n${event}: ${filename}`)
        await build()
      }
    },
  )

  process.on('SIGINT', () => {
    watcher.close()
    process.exit(0)
  })
}
