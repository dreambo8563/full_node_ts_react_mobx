import DB from "../db"
import * as moment from "moment"
import { redis } from "../redis"
import R = require("ramda")
import { removeLeftPaddingTime } from "../utils/timeFormat"
import { MD5 } from "../utils/encryption"
import { UserController } from "./userController"

const dataDB = DB.getInstance()

export class MissionsController {
  /**
   * 删除课程相关的课程任务
   *
   * @static
   * @param {number} uid
   * @param {number} tid
   * @param {number} cid
   * @memberof MissionsController
   */
  static async updateMissionStatus(
    uid: number,
    tid: number,
    courseid: number,
    statusCode: number,
    timeline?: number
  ) {
    let studMission = dataDB("data_1.game_user_mission")
      .where({
        uid: uid,
        tuid: tid,
        mission_id: 90,
        courseid: courseid,
        status: 1
      })
      .where("is_show", ">", 0)

    if (timeline) {
      studMission = studMission.where("create_time", "=", timeline)
    } else {
      studMission = studMission.where("create_time", ">=", moment().unix())
    }

    await studMission.update({
      status: statusCode,
      is_show: 0
    })

    let teacherMission = dataDB("data_1.game_user_mission")
      .where({
        uid: tid,
        tuid: uid,
        mission_id: 89,
        courseid: courseid,
        status: 1
      })
      .where("is_show", ">", 0)

    if (timeline) {
      teacherMission = teacherMission.where("create_time", "=", timeline)
    } else {
      teacherMission = teacherMission.where(
        "create_time",
        ">=",
        moment().unix()
      )
    }

    await teacherMission.update({
      status: statusCode,
      is_show: 0
    })

    // FIXME: 没找到哪里设置的,都是在删除
    await redis.del(`cstart:${uid}:${tid}:${courseid}`)
    // FIXME: 更新标志还不知道干什么用的
    await redis.setex(`mis:refresh:${uid}`, moment().unix(), -1)
    await redis.setex(`mis:refresh:${tid}`, moment().unix(), -1)
  }

  static async insertMissionRecord(
    courseInfo: any,
    uid: number,
    tid: number,
  ) {
  

    const gid = MD5(`${uid}${tid}${courseInfo.id}`).toString()
    let umid = MD5(`${uid}${tid}`).toString()
    let tmid = MD5(`${tid}${uid}`).toString()
    const userInfo: any = R.head(await UserController.getUserDetailInfo(uid))
    if (userInfo.cPay < 2000) {
      umid = `${umid.substring(0, umid.length - 4)}demo`
      tmid = `${tmid.substring(0, tmid.length - 4)}demo`
    }

    // log
    //   disk_logs('course_model/gen_course_mis_info/sus_start', [
    //     $s_uid,
    //     $timeline
    // ]);
    debugger

    // 插入学生任务数据
    const studentMission = {
      mid: umid,
      uid,
      tid,
      gid,
      mission_id: 90,
      courseid: courseInfo.id,
      is_show: 1,
      status,
      mission_status: 1,
      create_time: courseInfo.next_available_ts,
      update_time: courseInfo.next_available_ts
    }
    await dataDB("game_user_mission").insert(studentMission)

    // 插入mission log
    const studentMissionLog = {
      mid: umid,
      step: 0,
      step_num: 0,
      ext: "",
      status: 1,
      create_time: courseInfo.next_available_ts,
      update_time: courseInfo.next_available_ts
    }
    await dataDB("game_user_mission_log").insert(studentMissionLog)

    // 插入老师mission
    const teacherMission = {
      ...studentMission,
      mid: tmid,
      uid: tid,
      tuid: uid,
      mission_id: 89
    }
    await dataDB("game_user_mission").insert(teacherMission)

    // 老师mission log

    const teacherMissionLog = { ...studentMissionLog, mid: tmid }
    await dataDB("game_user_mission_log").insert(teacherMissionLog)
    
    return
  }
}
