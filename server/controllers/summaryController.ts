import DB from "../db"
import { ChartServices } from "../service/chart"
import * as Response from "../utils/response"
const dataDB = DB.getInstance()
export class SummaryController {
  /**
   * 获取钉钉群组图表数据
   *
   * @static
   * @param {{
   *       req: Express.Request
   *       res: Express.Response
   *     }} context
   * @param {number} start
   * @param {number} end
   * @memberof SummaryController
   */
  static async getWXDemoGroupChartData(
    context: {
      req: Express.Request
      res: Express.Response
    },
    start: number,
    end: number
  ) {
    const data = await ChartServices.getDingDemoGroup(start, end)
    Response.reponseData(context.res, data)
  }

  // ~~~~~~~~~~~~~~~~~~~~~下面逐步重构

  /**
   * 某个tid在星期X里被约的所有课,
   * 排除老师请假的,学生请假的,并且老师自己开了空闲时间的
   * 排除掉被假期停课影响的课
   *
   * @static
   * @param {number} tid
   * @param {number} week
   * @param {number} startTime
   * @param {number} endTime
   * @memberof SummaryController
   */
  static teacherCourseSummaryByWeekday(tid: number, week: number) {
    return dataDB
      .select("gu.cPay", "gcv.cn_start")
      .from("game_course_s AS gcs")
      .leftJoin("game_course_view AS gcv", "gcv.id", "gcs.courseid")
      .leftJoin("data_1.game_user AS gu", "gu.id", "gcs.uid")
      .leftJoin(
        "game_student_leave_course_view AS gslcv",
        "gslcv.sid",
        "gcs.sid"
      )
      .leftJoin("game_tutor_leave_course_view AS gtlcv", "gtlcv.sid", "gcs.sid")
      .leftJoin("game_course_suspend_list AS gcsl", function() {
        this.on("gcv.next_available_ts", ">=", "gcsl.suspend_start").andOn(
          "gcv.next_available_ts",
          "<",
          "gcsl.suspend_end"
        )
      })
      .innerJoin("game_course_t_view AS gctv", function() {
        this.on("gctv.tid", "=", "gcs.tid")
          .andOn("gctv.cn_week", "=", "gcv.cn_week")
          .andOn("gcv.cn_start", "=", "gctv.cn_start")
      })
      .whereIn("gcs.status", [-1, 0])
      .whereNull("gslcv.sid")
      .whereNull("gtlcv.sid")
      .whereNull("gcsl.id")
      .where({
        "gcv.cn_week": week,
        "gcs.tid": tid
      })
  }

  // static getCourseCount(uid: number) {
  //   return dataDB
  //     .select("gu.courseCount", dataDB.raw("sum(gch.consume_course)"))
  //     .from("game_course_history AS gch")
  //     .leftJoin("data_1.game_user as gu", "gu.id", "gch.uid")
  //     .whereRaw("consume_course > ?", 0)
  //     .where({
  //       uid
  //     })
  // }
}
