import * as Knex from "knex"
import * as moment from "moment"

import DB from "../db"

const dataDB = DB.getInstance()

export class ChartServices {
  static getDingDemoGroup(start: number, end: number): Knex.QueryBuilder {
    return dataDB
      .select("group", dataDB.raw("count(id) as total"))
      .from("game_book_lessons_group")
      .whereNull("deleted_at")
      .whereBetween("updated_at", [
        `${moment.unix(start).format("YYYY-MM-DD")} 00:00:00`,
        `${moment.unix(end).format("YYYY-MM-DD")} 23:59:59`
      ])
      .groupBy("group")
  }
}
