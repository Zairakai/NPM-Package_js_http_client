import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The library is made for the web: a project bundles it for the browser and expects to pay only for what it imports.
const root = fileURLToPath(new URL('../..', import.meta.url))

async function bundle(code: string) {
  const result = await build({
    stdin: { contents: code, resolveDir: root, loader: 'ts' },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    minify: true,
    logLevel: 'silent',
  })
  return result.outputFiles[0].text
}

describe('bundle for the browser', () => {
  it('declares sideEffects as the boolean false, which lets a bundler drop what is not imported', () => {
    const manifest = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'))
    expect(manifest.sideEffects).toBe(false)
  })

  it('builds the whole library for the browser without Node built-ins', async () => {
    const output = await bundle("export * from './src/index'")
    expect(output).not.toMatch(/["']node:/)
  })

  it('does not carry axios for the request tracker alone', async () => {
    const output = await bundle(
      "import { createRequestTracker } from './src/index'; console.log(createRequestTracker())",
    )
    expect(output).not.toMatch(/isAxiosError|AxiosHeaders/)
    expect(output.length).toBeLessThan(10_000)
  })
})
