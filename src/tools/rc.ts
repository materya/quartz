import * as fs from 'fs'
import * as path from 'path'

import { fs as cfs } from '@materya/carbon'

const rcfile = '.quartzrc.json'

const rcpath = cfs.find.up(process.cwd(), rcfile)

const config = JSON.parse(fs.readFileSync(rcpath, 'utf8'))
const { migrations, seeds } = config

const cleanPath = (p: string): string => p.replace(/^\.\//, '')

export default {
  config,
  root: path.dirname(rcpath),
  migrationsPath: migrations.path ? cleanPath(migrations.path) : 'migrations',
  seedsPath: seeds.path ? cleanPath(seeds.path) : 'seeds',
}
