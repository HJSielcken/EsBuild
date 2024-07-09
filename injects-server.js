import * as React from 'react'
import * as fs from 'fs'

export { fs, cx, React }

function cx(...args) {
  return args.filter(Boolean).join(' ')
}
