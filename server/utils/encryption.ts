import * as CryptoJS from "crypto-js"

export function HmacSha1(plainText: string, key: string) {
  return CryptoJS.HmacSHA1(plainText, key).toString()
}

export function nonce() {
  // get random number
  return Math.random()
    .toString(10)
    .substr(2)
}

export function timestamp() {
  // based on second not ms
  // TODO: can be instead with moment which we already import
  return Math.floor(Date.now() / 1000)
}

export function MD5(str: string) {
  return CryptoJS.MD5(str)
}
