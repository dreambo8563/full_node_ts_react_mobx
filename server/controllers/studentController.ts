import R = require("ramda")

import DB from "../db"

const dataDB = DB.getInstance()

export class StudentController {
  static getStudentAllInfo(uid: number) {
    return dataDB
      .select("gur.regTime", dataDB.raw("gu.*"))
      .from("game_user_regist as gur")
      .leftJoin("data_1.game_user AS gu", "gu.id", "gur.id")
      .where({
        "gu.id": uid
      })
  }
}
