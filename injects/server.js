import * as React from 'react'
import * as fs from 'fs'

export { cx, React, fs }

function cx(...args) {
  return args.filter(Boolean).join(' ')
}
