import * as fs from 'fs'
import * as path from 'path'

import { fs as mfs } from '@materya/base'

const rcfile = '.materyarc.json'

const rcpath = mfs.find.up(process.cwd(), rcfile)

const config = JSON.parse(fs.readFileSync(rcpath, 'utf8'))

export default {
  config,
  root: path.dirname(rcpath),
}
