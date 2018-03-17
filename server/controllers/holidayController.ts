import DB from "../db"
import { weekdays } from "moment"

const dataDB = DB.getInstance()

export class HolidayController {
  static isInHolidayByCourseIdQuery(
    courseid?: number,
    weekDay?: {
      start: string
      week: number
      tid: number
    }
  ) {
    let sql = dataDB("game_course_t_view as gcs").innerJoin(
      "game_course_suspend_list as gcsl",
      function() {
        this.on("gcs.next_available_ts", ">=", "gcsl.suspend_start").andOn(
          "gcs.next_available_ts",
          "<",
          "gcsl.suspend_end"
        )
      }
    )

    if (courseid) {
      sql = sql.where({
        "gcs.id": courseid
      })
    }
    if (weekDay) {
      sql = sql.where({
        "gcs.cn_week": weekDay.week,
        "gcs.cn_start": weekDay.start,
        "gcs.tid": weekDay.tid
      })
    }
    // console.log(sql.toString())
    return sql
  }
}
