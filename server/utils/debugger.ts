import * as debug from "debug"

// keep the debug function
let _debugger: any

export function debugInfo(...args: any[]) {
  if (!_debugger) {
    // start with 'server:global' for debug info
    _debugger = debug("server:global")
  }
  return _debugger.apply(this, arguments)
}
