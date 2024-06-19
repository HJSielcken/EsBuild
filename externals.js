import * as React from 'react'
import * as fs from 'fs'
import * as path from 'path'

export { React, fs, path, cx }

function cx(...args) {
  return args.filter(Boolean).join(' ')
}
