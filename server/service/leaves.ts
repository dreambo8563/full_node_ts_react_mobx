import * as Knex from "knex"

import DB from "../db"

const dataDB = DB.getInstance()

export class TutorLeaveServices {
  static getTutorLeaveListByFilter(config: {
    page?: number
    pageSize?: number
    keyword?: string
    start?: number
    end?: number
    status?: number | undefined // undefined - 全部  0-未完成 1-完成
    all?: boolean
  }): Knex.QueryBuilder {
    let basic = config.all
      ? dataDB.select(dataDB.raw("count(*) as total"))
      : dataDB.select(
          "gtl.id",
          "gtl.tid",
          "gtl.status",
          dataDB.raw(
            "DATE_FORMAT(convert_tz(from_unixtime(gtl.start), 'utc', 'Asia/Shanghai'), '%Y-%m-%d %H:%i') AS start"
          ),
          dataDB.raw(
            "DATE_FORMAT(convert_tz(from_unixtime(gtl.end), 'utc', 'Asia/Shanghai'), '%Y-%m-%d %H:%i') AS end"
          ),
          "gu.name"
        )
    basic = basic
      .from("game_tutor_leave as gtl")
      .leftJoin("data_1.game_user as gu", "gu.id", "gtl.tid")

    if (!config.all) {
      basic = basic
        .limit(config.pageSize)
        .offset((config.page - 1) * config.pageSize)
    } else {
      basic = basic.limit(1)
    }

    if (config.keyword) {
      basic = basic.where(function() {
        this.where("gu.name", "like", `%${config.keyword}%`).orWhere(
          "gtl.tid",
          "like",
          `%${config.keyword}%`
        )
      })
    }
    if (config.start && config.end) {
      basic = basic
        .where("gtl.start", ">=", config.start)
        .andWhere("gtl.start", "<=", config.end)
    }
    if (config.status != undefined && String(config.status).length > 0) {
      basic = basic.where("gtl.status", config.status)
    }

    return basic
  }
}
