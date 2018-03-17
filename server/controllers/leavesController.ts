import * as Knex from "knex"
import * as moment from "moment-timezone"
import R = require("ramda")

import DB from "../db"
import redisClient, { redis } from "../redis"
import { TutorLeaveServices } from "../service/leaves"
import * as Response from "../utils/response"
import { ClassRecordsController } from "./classRecordsController"
import { LogController } from "./logController"
import { MissionsController } from "./missionsController"

const dataDB = DB.getInstance()
export class LeavesController {
  /**
   * 获取老师请假列表,包含过滤条件
   *
   * @static
   * @param {{
   *       req: Express.Request
   *       res: Express.Response
   *     }} context
   * @param {({
   *       page?: number
   *       pageSize?: number
   *       keyword?: string
   *       start?: number
   *       end?: number
   *       status?: number | undefined // undefined - 全部  0-未完成 1-完成
   *       all?: boolean
   *     })} config
   * @memberof LeavesController
   */
  static async getTutorLeavesList(
    context: {
      req: Express.Request
      res: Express.Response
    },
    config: {
      page?: number
      pageSize?: number
      keyword?: string
      start?: number
      end?: number
      status?: number | undefined // undefined - 全部  0-未完成 1-完成
      all?: boolean
    }
  ) {
    const list = await TutorLeaveServices.getTutorLeaveListByFilter(config)
    const counts = await TutorLeaveServices.getTutorLeaveListByFilter({
      ...config,
      all: true
    })
    Response.reponseData(context.res, {
      list,
      total: R.head(<any[]>counts).total
    })
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // 下面有待重构 controller - service
  /**
   * 老师请长假的列表进行中的
   *
   * @static
   * @returns
   * @memberof LeavesController
   */
  static getLeavesTeachersQuery(): Knex.QueryBuilder {
    return dataDB
      .select("*")
      .from("game_tutor_leave")
      .where("status", 0)
  }

  /**
   * 学生请假的课程sid arr game_course_s表
   *
   * @static
   * @memberof LeavesController
   */
  static getStudentCourseLeaveArr(): Knex.QueryBuilder {
    return dataDB("game_student_leave_course_view").pluck("sid")
    // .then(result => {
    //   return (<any[]>result).map(v => v.sid)
    // })
    // return Promise.all([
    //   redis.get("courseDelAskForLeaveList").then(res => {
    //     // 本周课请假
    //     return R.values(JSON.parse(res || "{}"))
    //   }),
    //   redis.get("courseAskForLeaveList").then(res => {
    //     // 下周课请假
    //     return JSON.parse(res) || []
    //   })
    // ]).then(res => {
    //   return R.concat(res[0], res[1])
    //   // return dataDB.select("sid").from("game_student_leave_course_view")
    // })
  }

  /**
   * 由于学生原因临时调课,原来的课变成请假,这个课就是别转换为临时课的原课
   * 这种课也被归类于学生请假
   *
   * @static
   * @returns
   * @memberof LeavesController
   */
  static async getConvertedToTempCourses(): Promise<string[]> {
    return Promise.all([
      redis.get("changeCourseTmpList"),
      redis.get("changeCourseTmpNextWeekList")
    ]).then(res => {
      return R.concat(
        <any[]>JSON.parse(res[0] || "[]"),
        JSON.parse(res[1] || "[]")
      )
    })
  }

  /**
   *  获取老师请假对应的课程sid数组
   *
   * @static
   * @returns
   * @memberof LeavesController
   */
  static async getTeacherLeavesSid(): Promise<string[]> {
    return redis.get("courseDelAskForTutorLeaveList").then(res => {
      return Object.keys(JSON.parse(res || "{}"))
    })
  }

  /**
   * 学生请某一个sid课程的假
   *
   * @static
   * @param {number} sid
   * @memberof LeavesController
   */
  static async takeLeaveOnCourse(sid: number) {
    // FIXME:拿到操作人

    // 1. 先查看是否有这个课是否以前请过假
    const isOnLeave = await ClassRecordsController.isOnLeave(sid)
    if (isOnLeave) {
      throw new Error("请过假了...不用重复请假")
    } else {
      // 没请过假,或者这个课没有被长假影响到,需要做处理
      // 1. 获取相关信息
      const course = await ClassRecordsController.getCourseInfoBySid(sid)

      // 2. 入库请假
      // await this.insertLeaveRecord({
      //   uid: course.uid,
      //   start: course.next_available_ts,
      //   end: course.next_available_ts + 30 * 60,
      //   created_time: moment().unix()
      // })

      //  3. 短信通知
      const infoResult: any[] = await ClassRecordsController.getInfoForNotify(
        course.uid,
        course.tid,
        course.courseid
      )
      const info = R.head(infoResult)
      if (info) {
        // 钉钉通知
        // await SMSController.sendDelClassSMS(info)
      }
      // FIXME: 请假次数貌似没有入库
      // 2. $this->redis->get('studentOnLeaveCount'.$courseInfo['uid']); 这个请假次数不知道哪里的
      // 3. $studentOnLeaveCount += 1;
      console.log(course, "takeLeaveOnCourse")
      // FIXME: 给我用户信息
      const user: any = {}
      LogController.logSession(
        undefined,
        user.userName || "Student",
        "course manage",
        "course/select_course",
        course.uid,
        `Student on leave # uid:${course.uid} sid:${sid} week:${
          course.week
        } time:${course.start}-${
          course.end
        }  # changeUser:vincent # changTime:${moment
          .tz(parseInt(moment().format("x")), "Asia/Shanghai")
          .format("Y-M-D H:m")}`
      )
    }
  }

  /**
   * 插入学生请假表
   *
   * @static
   * @param {{
   *     uid: number
   *     start: number
   *     end: number
   *     created_time?: number
   *     status?: number
   *   }} info
   * @returns
   * @memberof LeavesController
   */
  static insertLeaveRecord(info: {
    uid: number
    start: number
    end: number
    created_time?: number
    status?: number
  }) {
    return dataDB("game_student_leave").insert(info)
  }

  static async takeLeavesOnCourseForTeacher(sid: number, reason: string) {
    // FIXME:拿到操作人
    // 1. 先查看是否有这个课是否以前请过假
    const isStuOnLeave = await ClassRecordsController.isOnLeave(sid)
    if (isStuOnLeave) {
      throw new Error("学生这节课已经请过假了")
    }
    const isTeacherOnLeave = await ClassRecordsController.isTeacherOnLeave(sid)
    if (isTeacherOnLeave) {
      throw new Error("老师这节课已经请过假了")
    } else {
      // 需要处理请假
      const data = await ClassRecordsController.getCourseInfoBySid(sid)
      // 老师请假入库
      // FIXME: 请假原因后续需入库处理
      if (data) {
        const exist = await dataDB("game_tutor_leave").where({
          tid: data.tid,
          start: data.next_available_ts
        })
        if (exist.length === 0) {
          this.insertLeaveRecordForTutor({
            tid: data.tid,
            start: data.next_available_ts,
            end: data.next_available_ts + 1800,
            timeline: moment().unix(),
            reason: reason
          })
        }

        // 更新任务状态
        await MissionsController.updateMissionStatus(
          data.uid,
          data.tid,
          data.courseid,
          -6
        )

        // 发送各种通知
        // FIXME: 需独立服务

        // $courseInfo = $this->get_course_info_by_sid($sid);
        // $user_info = $this->user_model->get_by_uid($courseInfo['uid']);
        // if (!empty($user_info) && $user_info['cPay'] >= 2000) {
        //     if (!empty($user_info['phoneNum'])) {
        //         $this->call_user_for_tutor_leave($user_info['phoneNum'],$sid);
        //     }
        //     $courseid = $courseInfo['courseid'];
        //     $this->send_user_wx_for_tutor_leave($sid,$courseInfo['uid'],$courseInfo['tid'],$courseid);
        // } else {
        //     $this->send_tutor_ding_for_tutor_leave($sid);
        // }

        // FIXME: 给我用户信息
        const user: any = {}
        LogController.logSession(
          undefined,
          user.userName || "Teachers",
          "course manage",
          "course/courseTutorAskForLeave",
          data.tid,
          `Teacher on leave # uid:${data.uid} tid:${data.tid} sid:${sid} time:${
            data.start
          }-${
            data.end
          } # changeUser:vincent REASON：${reason} # changTime:${moment
            .tz(parseInt(moment().format("x")), "Asia/Shanghai")
            .format("Y-M-D H:m")}`
        )
      }
    }
  }

  /**
   * 插入老师请假数据
   *
   * @static
   * @param {{
   *     tid: number
   *     start: number
   *     end: number
   *     timeline: number
   *     status?: number
   *   }} info
   * @returns
   * @memberof LeavesController
   */
  static insertLeaveRecordForTutor(info: {
    tid: number
    start: number
    end: number
    timeline: number
    status?: number
    reason?: string
  }) {
    return dataDB("game_tutor_leave").insert(info)
  }

  /**
   * 由于学生请假而临时空闲出来的老师
   *
   * @static
   * @returns {Knex.QueryBuilder}
   * @memberof LeavesController
   */
  static getStudentLeaveAffectTids(): Knex.QueryBuilder {
    return dataDB("game_student_leave_course_view").pluck("tid")
  }

  static isStudentOnLeaveByCourseIdQuery(
    uid: number,
    week: number,
    start: string
  ) {
    return dataDB("game_student_leave as gsl")
      .innerJoin("game_course_view AS gcv", function() {
        this.on("gcv.next_available_ts", ">=", "gsl.start").andOn(
          "gcv.next_available_ts",
          "<",
          "gsl.end"
        )
      })
      .where({
        "gsl.uid": uid,
        "gcv.cn_week": week,
        "gcv.cn_start": start
      })
  }
}
