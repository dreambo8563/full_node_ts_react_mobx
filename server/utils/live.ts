import * as Encryption from "../utils/encryption"
import * as moment from "moment"
import { Config } from "../config"

export function txSig(session: string) {
  const txTime = moment()
    .add(24, "hours")
    .unix()
    .toString(16)
    .toUpperCase()
  const liveCode = `${Config().live.bizid}_${session}`
  const txSecret = Encryption.MD5(
    `${Config().live.pushKey}${liveCode}${txTime}`
  )
  return {
    txTime,
    txSecret
  }
}

export function genUrls(session: string) {
  const bizid = Config().live.bizid
  const liveCode = `${bizid}_${session}`
  const sig = txSig(session)
  return {
    pushUrl: `rtmp://${bizid}.livepush.myqcloud.com/live/${liveCode}?txSecret=${
      sig.txSecret
    }&txTime=${sig.txTime}`,
    playUrl: `rtmp://${bizid}.liveplay.myqcloud.com/live/${liveCode}`,
    playUrlFLV: `http://${bizid}.liveplay.myqcloud.com/live/${liveCode}.flv`,
    playUrlHLS: `http://${bizid}.liveplay.myqcloud.com/live/${liveCode}.m3u8`
  }
}
