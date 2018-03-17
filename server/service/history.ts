import * as Knex from "knex"

import DB from "../db"

const dataDB = DB.getInstance()

export class CourseHistoryServices {
  /**
   * 根据学生姓名获取有正式课历史,条件为有课消,且有评价的记录,按上课时间倒序
   *
   * @static
   * @param {string} name 学生的名字
   * @param {string[]} columns  获取的字段
   * gce-game_course_history/gur-game_user_regist/gu-game_user
   * @returns {Knex.QueryBuilder}
   * @memberof HistoryServices
   */
  static getOfficialCourseRecordsWithFeedbackByName(
    name: string,
    columns: string[],
    startT?: number,
    endT?: number
  ): Knex.QueryBuilder {
    let sql = dataDB
      .select(...columns)
      .from("game_course_history AS gch")
      .leftJoin("data_1.game_course_evaluate AS gce", function() {
        this.on("gch.sid ", "gce.sid").andOn("gch.time_frame", "gce.classTime")
      })
      .leftJoin("game_user_regist as gur", "gch.uid", "gur.id")
      .leftJoin("data_1.game_user as gu", "gu.id", "gur.id")
      .andWhere("gch.consume_course", ">", 0)
      .where(function() {
        this.where("gch.status", 1).orWhere({
          "gch.status": 2,
          "gch.teacher_is_late": 1
        })
      })
      .whereNotNull("gce.option_info")
      .whereRaw("length(gce.option_info) > ?", 0)
      .where({
        "gch.type": 1,
        "gur.name": name
      })
      .orderBy("gch.time_frame")
    if (startT) {
      sql = sql.where("gch.time_frame", ">=", startT)
    }
    if (endT) {
      sql = sql.where("gch.time_frame", "<=", endT)
    }
    return sql
  }

  /**
   * 获取正式课数量,通过学生姓名 - 有课消的
   *
   * @static
   * @param {number} start 开始时间
   * @param {number} end 结束时间
   * @param {string} name 学生姓名
   * @param {string} [alias="num"] 返回的字段别名,默认num
   * @returns {Knex.QueryBuilder}
   * @memberof CourseHistoryServices
   */
  static courseCountByName(
    start: number,
    end: number,
    name: string,
    alias: string = "num"
  ): Knex.QueryBuilder {
    return dataDB
      .select(dataDB.raw(`count(*) as ${alias}`))
      .from("game_course_history AS gch")
      .leftJoin("game_user_regist as gur", "gch.uid", "gur.id")
      .andWhere("gch.consume_course", ">", 0)
      .where({
        "gch.type": 1,
        "gur.name": name
      })
      .where("gch.time_frame", ">=", start)
      .andWhere("gch.time_frame", "<=", end)
  }

  /**
   * 获取第一次正式课的时间-有课消的
   *
   * @static
   * @param {string} name
   * @param {number} type
   * @returns {Knex.QueryBuilder}
   * @memberof CourseHistoryServices
   */
  static getTimeForFirstClass(name: string, type: number): Knex.QueryBuilder {
    return dataDB
      .select("gch.time_frame", "gur.id")
      .from("game_course_history AS gch")
      .leftJoin("game_user_regist as gur", "gch.uid", "gur.id")
      .andWhere("gch.consume_course", ">", 0)
      .where({
        "gch.type": type,
        "gur.name": name
      })
      .orderBy("gch.time_frame")
      .limit(1)
  }
  /**
   * 获取最近完成的正式课时间 - 有课消的
   *
   * @static
   * @param {string} name
   * @param {number} type
   * @returns {Knex.QueryBuilder}
   * @memberof CourseHistoryServices
   */
  static getLatestRecord(name: string, type: number): Knex.QueryBuilder {
    return dataDB
      .select("gch.time_frame", "gur.id", "gch.lesson","gch.ver_id")
      .from("game_course_history AS gch")
      .leftJoin("game_user_regist as gur", "gch.uid", "gur.id")
      .andWhere("gch.consume_course", ">", 0)
      .where({
        "gch.type": type,
        "gur.name": name
      })
      .orderBy("gch.time_frame", "desc")
      .limit(1)
  }

  /**
   * 反馈次数: 注意,这里不是真正的反馈次数,在1515974400之后的评价走这个表
   *
   * @static
   * @param {string} name
   * @param {number} [startT]
   * @param {number} [endT]˝
   * @returns {Knex.QueryBuilder}
   * @memberof CourseHistoryServices
   */
  static getFeedbackTimes(
    name: string,
    startT?: number,
    endT?: number
  ): Knex.QueryBuilder {
    let sql = dataDB
      .select(dataDB.raw("count(*) as num"))
      .from("game_course_history AS gch")
      .leftJoin("game_user_regist as gur", "gch.uid", "gur.id")
      .where(function() {
        this.where("gch.status", 1).orWhere({
          "gch.status": 2,
          "gch.teacher_is_late": 1
        })
      })
      .where({
        "gch.type": 1,
        "gur.name": name
      })
    if (startT) {
      sql = sql.where("gch.time_frame", ">=", startT)
    }
    if (endT) {
      sql = sql.where("gch.time_frame", "<=", endT)
    }
    return sql
  }

  /**
   * 在1515974400之前的评价走这个表
   *
   * @static
   * @param {number} uid
   * @param {number} [startT]
   * @param {number} [endT]
   * @returns {Knex.QueryBuilder}
   * @memberof CourseHistoryServices
   */
  static getOldFeedbackTimes(
    uid: number,
    startT?: number,
    endT?: number
  ): Knex.QueryBuilder {
    let sql = dataDB
      .select(dataDB.raw("count(*) as num"))
      .from("data_1.game_user_rmark AS rm")
      .where({
        "rm.uid": uid
      })
    if (startT) {
      sql = sql.where("rm.classTime", ">=", startT)
    }
    if (endT) {
      sql = sql.where("rm.classTime", "<=", endT)
    }
    return sql
  }
}

export class ReportHistoryServices {
  /**
   * 获取最新的历史创建的报告
   *
   * @static
   * @param {number} type 报告的类型
   * @param {object} filter 其他过滤条件
   * @returns {Knex.QueryBuilder}
   * @memberof ReportHistoryServices
   */
  static getLatestReportHistory(
    type: number,
    filter: object
  ): Knex.QueryBuilder {
    return dataDB("game_report_history")
      .where({
        ...filter,
        report_id: type
      })
      .orderBy("created_time", "desc")
      .limit(1)
  }
  /**
   * 根据唯一id获取报表历史
   *
   * @static
   * @param {number} id game_report_history自增id
   * @param {number} type 报表类型report_id
   * @returns
   * @memberof ReportHistoryServices
   */
  static getReportHistoryById(id: number, type: number) {
    return dataDB("game_report_history").where({
      id,
      report_id: type
    })
  }

  /**
   * 插入报表历史记录
   *
   * @static
   * @param {IReportHistoryRecord} record
   * @returns
   * @memberof ReportHistoryServices
   */
  static insertHistoryRecord(record: IReportHistoryRecord) {
    return dataDB("game_report_history").insert(record)
  }
}
