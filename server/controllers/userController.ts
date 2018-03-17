import R = require("ramda")

import DB from "../db"

const dataDB = DB.getInstance()

export class UserController {
  /**
   * 返回用户注册信息
   * //FIXME:最好返回query,增加复用几率
   *
   * @static
   * @param {number} uid
   * @returns
   * @memberof UserController
   */
  static async getUserRegistInfo(uid: number) {
    const info: any[] = await dataDB
      .select(dataDB.raw("*"))
      .from("game_user_regist")
      .where({
        id: uid
      })
    if (info.length === 0) {
      throw new Error(`没找到用户信息: uid - ${uid}`)
    }
    return R.head(info)
  }

  /**
   * game_user表 具体信息
   *
   * @static
   * @param {number} [uid]
   * @returns
   * @memberof UserController
   */
  static getUserDetailInfo(uid?: number) {
    let sql = dataDB("data_1.game_user")
    if (uid) {
      sql = sql.where({
        id: uid
      })
    }
    return sql
  }

  /**
   * 根据用户名 换取uid
   *
   * @static
   * @param {string} name
   * @returns
   * @memberof UserController
   */
  static getUserIdByName(name: string) {
    let sql = dataDB("data_1.game_user").pluck("id")
    sql = sql.where({
      name: name
    })
    return sql
  }
}
