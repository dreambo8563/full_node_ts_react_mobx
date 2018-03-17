import * as Knex from "knex"
import { Config } from "../config/"

let db: Knex
export default class DB {
  static getInstance(dbName = "data") {
    if (!db) {
      db = Knex({ ...Config().db, database: dbName })
    }
    return db
  }
}
