import * as Knex from "knex"

import DB from "../db"

const dataDB = DB.getInstance()

export class LogServices {
  /**
   * 某节课的uid一方的网络状况数据
   *
   * @static
   * @param {number} uid
   * @param {number} student_id
   * @param {number} teacher_id
   * @param {number} classTime
   * @returns {Knex.QueryBuilder}
   * @memberof LogServices
   */
  static getNetworkDataForCourse(
    uid: number,
    student_id: number,
    teacher_id: number,
    classTime: number
  ): Knex.QueryBuilder {
    return dataDB("data_1.video_net_monitor")
      .where({
        uid,
        student_id,
        teacher_id,
        class_time: classTime
      })
      .orderBy("create_time")
  }

  /**
   * 某节课的错误日志
   *
   * @static
   * @param {number} student_id 学生id
   * @param {number} teacher_id 老师id
   * @param {number} classTime 上课时间
   * @param {{
   *       pageSize?: number
   *       page?: number
   *       source?: number
   *       type?: number
   *     }} filter
   * @returns {Knex.QueryBuilder}
   * @memberof LogServices
   */
  static getErrorLogForCourse(
    student_id: number,
    teacher_id: number,
    classTime: number,
    filter: {
      source?: number
      type?: number
    }
  ): Knex.QueryBuilder {
    let sql = dataDB("data_1.video_net_error").where({
      student_id,
      teacher_id,
      class_time: classTime
    })
    if (filter.type) {
      sql = sql.where({
        type: filter.type
      })
    }

    switch (filter.source) {
      case 2:
        sql = sql.where({
          uid: student_id
        })
        break
      case 1:
        sql = sql.where({
          uid: teacher_id
        })
        break
      default:
        break
    }

    return sql.orderBy("create_time", "desc")
  }
}
