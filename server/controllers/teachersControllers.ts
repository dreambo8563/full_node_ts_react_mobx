import DB from "../db"
import * as Knex from "knex"
import { redis } from "../redis"
const dataDB = DB.getInstance()

export class TeachersController {
  static getBasicInfoQuery(tid?: number) {
    let sql = dataDB.select("*").from("game_teacher")
    if (tid) {
      sql = sql.where({
        uid: tid
      })
    }
    return sql
  }

  /**
   * 从redis获取被锁定的老师
   *
   * @static
   * @returns
   * @memberof ClassRoomController
   */
  static getLockedTeachers() {
    return redis.keys("lockEchoTeacherTime*")
  }

  static getAllTeacherInfo(tid: number) {
    return dataDB
      .select("gt.tBilligual", "gur.isHighSales", dataDB.raw("gt.uid as tid"))
      .from("game_teacher AS gt")
      .leftJoin("game_user_regist AS gur", "gur.id", "gt.uid")
      .leftJoin("data_1.game_user AS gu", "gu.id", "gt.uid")
      .where({
        uid: tid
      })
  }

  static searchByKeywords(words: string) {
    return dataDB
      .select("gu.id", "gu.name")
      .from("data_1.game_user as gu")
      .where({ role: 1 })
      .where("gu.name", "like", `%${words}%`)
  }
}
