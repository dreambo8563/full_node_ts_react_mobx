import * as path from "path"
import { debugInfo } from "../utils/debugger"

// keep current config
let _config: any

// get mode from env
export function env() {
  return process.env.NODE_ENV || "development"
}
// get project root path
export function rootDir() {
  return path.resolve("./")
}
// load config based on the env
export function Config() {
  if (!_config) {
    _config = require(`./${env()}`)
  }
  return _config.config
}
export function Initialize() {
  Config()
  debugInfo("Current ENV is:", env())
  debugInfo("Server Root Dir is:", rootDir())
}
