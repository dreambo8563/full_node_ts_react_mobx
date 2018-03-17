import * as Knex from "knex"

import DB from "../db"

const dataDB = DB.getInstance()

export class UserServices {
  static getUserIdByName(name: string): Knex.QueryBuilder {
    return dataDB("data_1.game_user")
      .pluck("id")
      .where({
        name: name
      })
  }
}
