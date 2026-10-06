// Generates what is not written by hand, so that it cannot drift from the code:
//   docs/reference/   the public API, by TypeDoc, from the source
//   docs/guide/readme.md   the guide, copied from the README without its badges
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const docs = resolve(here, '..')
const root = resolve(docs, '..')

execFileSync('npx', ['typedoc', '--options', join(docs, 'typedoc.json')], { cwd: docs, stdio: 'inherit' })

// The README starts with badges and a one line summary, then a first rule: the guide begins after it.
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const [, ...rest] = readme.split(/^---\s*$/m)
const title = /^# (.+)$/m.exec(readme)?.[1] ?? 'Guide'
const body = rest
  .join('---')
  // The reference-style links of the badges at the end of the README are not needed.
  .replace(/^\[[^\]]+\]:\s.*$/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

mkdirSync(join(docs, 'guide'), { recursive: true })
writeFileSync(join(docs, 'guide', 'readme.md'), `# ${title}\n\n${body}\n`)
console.log('reference and guide written')
