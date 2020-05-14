import * as fs from 'fs'
import * as path from 'path'

import { fs as cfs } from '@materya/carbon'

const rcfile = '.materyarc.json'

const rcpath = cfs.find.up(process.cwd(), rcfile)

const config = JSON.parse(fs.readFileSync(rcpath, 'utf8'))

export default {
  config,
  root: path.dirname(rcpath),
}
