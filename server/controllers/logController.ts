import DB from "../db"

const dataDB = DB.getInstance()

export class LogController {
  static async logSession(
    uid: number = 0,
    realname: string = "NULL",
    opname: string,
    uri: string,
    opid: number,
    info: string = "",
    ip: string = "127.0.0.1"
  ) {
    return dataDB("game_logger").insert({
      uid,
      realname,
      opname,
      uri,
      opid,
      info,
      ip
    })
  }
}
