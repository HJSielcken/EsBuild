import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
// import * as stream from 'stream'


export { React, cx, ReactDOM }

function cx(...args) {
  return args.filter(Boolean).join(' ')
}
