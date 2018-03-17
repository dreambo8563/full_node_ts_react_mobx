import DB from "../db"
import { redis } from "../redis"
import R = require("ramda")

const dataDB = DB.getInstance()

export class InitController {
  /**
   * 学生请假信息入库
   *
   * @static
   * @memberof InitController
   */
  static async saveStuLeavesIntoDB() {
    dataDB("game_student_leave").truncate()
    const keys = await redis.keys("course_student_long_ask_*")
    // console.log(keys)
    for (const key of keys) {
      const v = await redis.get(key)
      // console.log(key.replace("course_student_long_ask_", ""), v)
      const info = JSON.parse(v)

      console.log({
        uid: key.replace("course_student_long_ask_", ""),
        start: info.start,
        end: info.end,
        created_time: info.operate_time || info.start
      })

      dataDB("game_student_leave")
        .insert({
          uid: key.replace("course_student_long_ask_", ""),
          start: info.start,
          end: info.end,
          created_time: info.operate_time || info.start
        })
        .then(res => {
          console.log(res)
        })
    }
    let longLeaveArr = await dataDB("game_student_leave_course_view").pluck(
      "sid"
    )
    // console.log(
    //   "R.contains(54609,longLeaveArr)",
    //   R.contains(54609, longLeaveArr)
    // )
    const allLeave = await Promise.all([
      redis.get("courseDelAskForLeaveList").then(res => {
        // 本周课请假
        return R.values(JSON.parse(res || "{}"))
      }),
      redis.get("courseAskForLeaveList").then(res => {
        // 下周课请假
        return JSON.parse(res) || []
      })
    ]).then(res => {
      return R.concat(res[0], res[1]).map(v => parseInt(v))
      // return dataDB.select("sid").from("game_student_leave_course_view")
    })

    const diff = R.difference(allLeave, longLeaveArr)
    // console.log("R.contains(54609,diff)", R.contains(54609, diff))
    // console.log(allLeave.filter(v => v == 54609).length)

    // const keys6 = await redis.get("course_student_long_ask_61639")
    // console.log(JSON.parse(keys6))

    const result = await dataDB
      .select("gcv.next_available_ts", "gcs.uid")
      .from("game_course_s as gcs")
      .leftJoin("game_course_view as gcv", "gcv.id", "gcs.courseid")
      .whereIn("gcs.sid", diff)

    for (const item of result) {
      dataDB("game_student_leave")
        .insert({
          uid: item.uid,
          start: item.next_available_ts,
          end: item.next_available_ts + 30 * 60,
          created_time: item.next_available_ts
        })
        .then(res => {
          console.log(res)
        })
    }
  }

  static async saveTeacherLeavesIntoDB() {
    const leaveArr = await redis.get("courseDelAskForTutorLeaveList")
    console.log(leaveArr)
    for (const sid of Object.keys(JSON.parse(leaveArr))) {
      console.log(sid)
      const info: any[] = await dataDB("game_course_s as gcs")
        .leftJoin("game_course_view as gcv", "gcs.courseid", "gcv.id")
        .where({
          sid: sid
        })
      console.log(info)
      const data = R.head(info)
      if (data) {
        const reason = await redis.get(
          `tutor_leave_time_in_24_hour_reason_${sid}`
        )
        const exist = await dataDB("game_tutor_leave").where({
          tid: data.tid,
          start: data.next_available_ts
        })
        if (exist.length === 0) {
          await dataDB("game_tutor_leave").insert({
            tid: data.tid,
            start: data.next_available_ts,
            end: data.next_available_ts + 1800,
            timeline: data.next_available_ts,
            reason
          })
        }
      }
    }
  }
}
