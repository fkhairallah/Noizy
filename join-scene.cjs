const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'src', 'visual')
const names = [
  'scene.ts.part00',
  'scene.ts.part01',
  'scene.ts.part02',
  'scene.ts.part03',
  'scene.ts.part04',
  'scene.ts.part05',
  'scene.ts.part06',
  'scene.ts.part07',
  'scene.ts.part07b',
  'scene.ts.part07c',
  'scene.ts.part08',
  'scene.ts.part09',
]

const first = path.join(dir, names[0])
if (!fs.existsSync(first)) process.exit(0)

const body = Buffer.concat(names.map((name) => fs.readFileSync(path.join(dir, name))))
fs.writeFileSync(path.join(dir, 'scene.ts'), body)
for (const name of names) fs.unlinkSync(path.join(dir, name))
