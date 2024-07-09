import * as React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import * as stream from 'stream'

export { fs, path, cx, stream, React }

function cx(...args) {
  return args.filter(Boolean).join(' ')
}
