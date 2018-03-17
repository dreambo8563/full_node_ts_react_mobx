import * as Knex from "knex"
import * as moment from "moment-timezone"
import R = require("ramda")

import DB from "../db"
import redisClient, { redis } from "../redis"
import { LeavesController } from "./leavesController"
import { LogController } from "./logController"
import { MailController } from "./mailController"
import { MissionsController } from "./missionsController"
import { PushController } from "./pushController"
import { SMSController } from "./smsController"
import { TeachersController } from "./teachersControllers"
import { UserController } from "./userController"
import { HolidayController } from "./holidayController"
import { SummaryController } from "./summaryController"
import { StudentController } from "./studentController"
import { removeLeftPaddingTime } from "../utils/timeFormat"

const dataDB = DB.getInstance()
const busyTime = {
  start: "18:30",
  end: "21:00"
}
export class ClassRecordsController {
  /**
   * 所有老师的可约课时间列表
   *
   * @static
   * @param {{
   *       page: number
   *       pageSize: number
   *       week: number
   *       all: boolean
   *     }} [config={
   *       page: 1,
   *       pageSize: 20,
   *       week: 0,
   *       all: false
   *     }]
   * @returns
   * @memberof ClassRecordsController
   */
  static async getAvailbelTeachers(
    config: {
      page: number
      pageSize: number
      week: number
      all: boolean
    } = {
      page: 1,
      pageSize: 20,
      week: 0,
      all: false
    }
  ) {
    // 从redis获取被锁定的老师 - 已转为set类型
    const hasCache = await redisClient.exist("teachers", "lockedIds")
    if (!hasCache) {
      const lockedIds = await TeachersController.getLockedTeachers()
      let lockedArr = []
      for (let key of lockedIds) {
        const locked = await redis.get(key)
        lockedArr.push({
          key,
          locked
        })
      }
      await redisClient.addSet(
        "teachers",
        "lockedIds",
        lockedArr
          .filter(v => parseInt(v.locked))
          .map(v => v.key.substring("lockEchoTeacherTime".length))
      )
    }

    const ids: string[] = await redisClient.getSetMembers(
      "teachers",
      "lockedIds"
    )

    // 正在请假的老师
    const allLeavesTeachers = LeavesController.getLeavesTeachersQuery().as(
      "ltp"
    )

    // 占位课+正常状态课
    const inProgressCourseQuery = this.getInProgressRecordsWithTs().as("gcs")

    // 老师基本信息
    const teachersInfoQuery = TeachersController.getBasicInfoQuery().as("t")

    // 学生请假 短期+长期的 sid arr
    const leavesArr = await LeavesController.getStudentCourseLeaveArr()

    let allAvailabelTime = config.all
      ? dataDB.select(dataDB.raw("count(*) as total"))
      : dataDB.select(
          "gcv.id",
          "gcv.tid",
          "gu.name",
          "gcv.status",
          "gcv.cn_start",
          "gcv.cn_end",
          "gcv.cn_week",
          "gcv.next_available_ts",
          "t.tags",
          "t.basis_tutor", // 能上0基础
          "t.tDemo", // 能上demo课
          "t.tBilligual", //小明星
          "t.tDuty" //demo值班
          // dataDB.raw("count(*) as count")
        )
    allAvailabelTime = allAvailabelTime
      .distinct()
      .from("game_course_t_view as gcv")
      .leftJoin(allLeavesTeachers, function() {
        // 排除请假老师中,时间冲突的
        this.on("ltp.tid", "=", "gcv.tid").andOnBetween(
          "gcv.next_available_ts",
          [dataDB.raw("ltp.start"), dataDB.raw("ltp.end")]
        )
      })
      .leftJoin(inProgressCourseQuery, function() {
        // 排除时间一样,已经预约了的课程中的老师
        this.on("gcs.tid", "=", "gcv.tid")
          .andOn("gcv.next_available_ts", "=", "gcs.next_available_ts")
          // .andOn("gcv.cn_start", "gcs.cn_start")
          .andOnNotIn("gcs.sid", leavesArr)
      })
      .leftJoin(teachersInfoQuery, "t.uid", "gcv.tid")
      .leftJoin("data_1.game_user as gu", "gu.id", "gcv.tid")
      .whereNull("gcs.tid")
      .whereNull("ltp.tid")
      .andWhere("gcv.status", 0)

    if (config.week != 0) {
      allAvailabelTime = allAvailabelTime.where("gcv.cn_week", config.week)
    }

    if (!config.all) {
      if (config.pageSize > 0) {
        allAvailabelTime = allAvailabelTime
          .limit(config.pageSize)
          .offset((config.page - 1) * config.pageSize)
      }
    }

    if (ids.length > 0) {
      // 去除被锁定的老师
      allAvailabelTime = allAvailabelTime.whereNotIn("gcv.tid", ids)
    }
    return allAvailabelTime
  }

  static async delClassRoom(sid: number) {
    // 查找此课程
    const course = await this.getClassInfoBySid(sid)

    // 更新课程状态为 2- 某种完成
    await this.updatelassRoomBySid(sid, {
      status: 2
    })

    //  更新game_course表格里面的选课学生数，因为这个要在算法里面用到?? 啥算法
    const { courseid, uid, tid } = course
    await this.updateScount(courseid)

    if (course.status === 0) {
      // 删除推送记录
      await PushController.delCoursePush(uid, courseid)

      const infoResult: any[] = await this.getInfoForNotify(uid, tid, courseid)
      const info = R.head(infoResult)
      if (info) {
        // 发送课程删除的通知邮件
        await MailController.sendCourseRemoveMail(info)
        // 钉钉通知
        await SMSController.sendDelClassSMS(info)
        // 删除任务
        await MissionsController.updateMissionStatus(uid, tid, courseid, -3)
      }
    }
    // FIXME: 给我用户信息
    LogController.logSession(
      undefined,
      "vincent",
      "course manage",
      "course/delete",
      uid,
      `delete Course # sid:${sid} # deleteUser:vincent # changTime:${moment
        .tz(parseInt(moment().format("x")), "Asia/Shanghai")
        .format("Y-M-D H:m")}`
    )
  }
  /**
   * 通过sid来更新game_course_s信息
   *
   * @static
   * @param {number} sid
   * @param {object} obj
   * @memberof ClassRecordsController
   */
  static async updatelassRoomBySid(sid: number, obj: object) {
    await dataDB("game_course_s")
      .where("sid", sid)
      .update({
        ...obj
      })
  }

  static async updateScount(courseid: number) {
    const selectedNum = await dataDB("game_course_s")
      .select(dataDB.raw("count(*) as num"))
      .where("courseid", courseid)
      .andWhere("status", 0)

    await dataDB("game_course")
      .where("id", courseid)
      .update({
        scount: R.pathOr(0, ["0", "num"], selectedNum)
      })
  }

  /**
   * 获取发邮件,钉钉的基本信息
   *
   * @static
   * @param {number} uid
   * @param {number} tid
   * @param {number} cid
   * @returns
   * @memberof ClassRecordsController
   */
  static getInfoForNotify(uid: number, tid: number, cid: number) {
    return dataDB
      .select(
        "gum.mid",
        "gur.name",
        dataDB.raw("gur2.name AS t_name"),
        dataDB.raw(
          "date_format(convert_tz(from_unixtime(gcv.next_available_ts),'utc',gtm.name),'%c/%d') as local_day"
        ),
        dataDB.raw(
          "date_format(convert_tz(from_unixtime(gcv.next_available_ts),'utc',gtm.name),'%H:%i') as local_time"
        )
      )
      .from("data_1.game_user_mission as gum")
      .leftJoin("game_user_regist AS gur", "gur.id", "gum.uid")
      .leftJoin("game_user_regist AS gur2", "gum.tuid", "gur2.id")
      .leftJoin("game_course_view as gcv", "gum.courseid", "gcv.id")
      .leftJoin("data_1.game_user as gu", "gu.id", "gum.tuid")
      .leftJoin("game_timezone_mapping as gtm", "gu.zone", "gtm.id")
      .where({
        uid: uid,
        tuid: tid,
        mission_id: 90,
        courseid: cid,
        status: 1
      })
      .where("is_show", ">", 0)
  }

  /**
   * 正常的已经约好的课
   *
   * @static
   * @returns
   * @memberof CoursesController
   */
  static getInProgressRecordsWithTs() {
    return dataDB
      .select("*")
      .from("game_course_s as gcs")
      .leftJoin("game_course_view as gcv", "gcv.id", "gcs.courseid")
      .whereIn("gcs.status", [-1, 0])
  }

  /**
   * 所有已经约好的课程,包括学生请假,老师请假的,临时的状态的,占位的
   *
   * @static
   * @param {{
   *       page: number
   *       currentWeek: number
   *       pageSize: number
   *       type: number
   *       all: boolean
   *     }} [config={
   *       page: 1,
   *       currentWeek: 0,
   *       pageSize: 20,
   *       type: 0,
   *       all: false
   *     }]
   * @returns
   * @memberof ClassRecordsController
   */
  static async getPreservedClassRecords(
    config: {
      page: number
      currentWeek: number
      pageSize: number
      type: number
      all: boolean
    } = {
      page: 1,
      currentWeek: 0,
      pageSize: 20,
      type: 0,
      all: false
    }
  ) {
    const { page, pageSize, currentWeek, type, all } = config

    // console.log(leaveList.join(','))
    // const innerQuery = dataDB
    //   .select("uid", "adminUser", dataDB.raw("count('courseid') as classCount"))
    //   .from("game_course_s")
    //   .groupByRaw("uid,adminUser")
    //   .as("m")
    const [tempList, studentLeavesArr] = await Promise.all([
      LeavesController.getConvertedToTempCourses(),
      LeavesController.getStudentCourseLeaveArr()
    ])
    const leaveList = R.concat(tempList, studentLeavesArr)

    const teachersLeavesSids = await LeavesController.getTeacherLeavesSid()

    let basicSql: Knex.QueryBuilder
    if (all) {
      basicSql = dataDB.select(dataDB.raw("count(*) as count"))
    } else {
      basicSql = dataDB.select(
        "cs.sid",
        "cs.tid",
        dataDB.raw(
          `(find_in_set(cs.sid,"${leaveList.join(",")}") != 0) AS stuLeave`
        ),
        dataDB.raw(
          `(find_in_set(cs.sid,"${teachersLeavesSids.join(
            ","
          )}") != 0) AS teacherLeave`
        ),
        dataDB.raw("cs.status=-1 as isPlaceholder"),
        "cs.uid",
        "u.used_course",
        "cs.adminUser",
        "cs.courseid",
        "ur.name AS stuName",
        "c.start",
        "c.end",
        "cs.status",
        "u.s_mark AS stuMark",
        "t.s_mark  AS teacheMark",
        "t.name AS teacheName",
        dataDB.raw("u.courseCount < 10 AS isNew"),
        dataDB.raw("u.cPay < 2000 AS isDemo"),
        "u.courseCount as classCount",
        "cs.create_time as bookTime",
        // dataDB.raw("c.cid%100 as timeLine"),
        dataDB.raw("c.cn_week as week")
      )
    }

    basicSql = basicSql
      .from("game_course_s as cs")
      .leftJoin("game_user_regist as ur", "cs.uid", "ur.id")
      .leftJoin("game_course_view as c", "c.id", "cs.courseid")

    if (currentWeek != 0) {
      basicSql = basicSql.where("c.cn_week", `${currentWeek}`)
    }
    basicSql = basicSql
      .leftJoin("data_1.game_user as u", "u.id", "cs.uid")
      .leftJoin("game_user_regist as tr", "tr.id", "cs.uid")
      .leftJoin("data_1.game_user as t", "t.id", "cs.tid")
      // .leftJoin(innerQuery, function() {
      //   this.on("m.uid", "=", "t.id").andOn("cs.adminUser", "=", "m.adminUser")
      // })
      .where(function() {
        this.where("ur.db", 1).orWhere(dataDB.raw("LENGTH(cs.uid)=?", 11))
      })
      .whereIn("cs.status", [-1, 0])
      .orderBy("c.id")

    if (!all) {
      basicSql = basicSql.offset((page - 1) * pageSize).limit(pageSize)
    }
    switch (type) {
      case 1:
        basicSql = basicSql.where("u.cPay", ">=", 2000)
        break
      case 2:
        basicSql = basicSql.where("u.cPay", "<", 2000)
        break
      case 3:
        basicSql = basicSql.whereIn("cs.sid", leaveList)
        break
      case 4:
        basicSql = basicSql.whereIn("cs.sid", teachersLeavesSids)
        break
      default:
        break
    }

    return basicSql

    // basicSql.select(dataDB.raw("count(*) as count"))
  }

  /**
   * 获取这节课的基本信息
   * game_course_s 表
   * @static
   * @param {number} sid
   * @returns
   * @memberof ClassRecordsController
   */
  static async getClassInfoBySid(sid: number) {
    const courses: any[] = await dataDB("game_course_s").where("sid", sid)
    if (courses.length === 0) {
      // 没找到说明前端数据有错误,直接提示
      throw Error("此课程不存在")
    }
    return R.head(courses)
  }

  /**
   * 查看这个课学生以前是否请过假
   *
   * @static
   * @param {number} sid
   * @returns {Promise<boolean>}
   * @memberof ClassRecordsController
   */
  static async isOnLeave(sid: number): Promise<boolean> {
    const courses: any[] = await dataDB("game_student_leave_course_view").where(
      "sid",
      sid
    )
    return courses.length > 0
  }

  /**
   * 获取这个课已经课程本身的信息
   * game_course_s + game_course_view
   * @static
   * @param {number} sid
   * @returns
   * @memberof ClassRecordsController
   */
  static async getCourseInfoBySid(sid: number) {
    const courses: any[] = await dataDB("game_course_s as gcs")
      .leftJoin("game_course_view as gcv", "gcv.id", "gcs.courseid")
      .where("sid", sid)
    if (courses.length === 0) {
      // 没找到说明前端数据有错误,直接提示
      throw Error("此课程不存在")
    }
    return R.head(courses)
  }

  /**
   * 这个课老师是否正在请假中,也就是老师请假是否影响这个课
   *
   * @static
   * @param {number} sid
   * @returns {Promise<boolean>}
   * @memberof ClassRecordsController
   */
  static async isTeacherOnLeave(sid: number): Promise<boolean> {
    const courses: any[] = await dataDB("game_tutor_leave_course_view").where(
      "sid",
      sid
    )
    return courses.length > 0
  }

  /**
   * 放弃demo课
   *
   * @static
   * @param {number} sid
   * @memberof ClassRecordsController
   */
  static async giveUpDemoCourse(sid: number) {
    // 1. 查询是否还有这个课
    const course = await this.getCourseInfoBySid(sid)
    // 更新课程状态为 2- 某种完成
    await this.updatelassRoomBySid(sid, {
      status: 2
    })
    //  更新game_course表格里面的选课学生数，
    // FIXME:因为这个要在算法里面用到?? 啥算法
    const { courseid, uid, tid } = course
    await this.updateScount(courseid)

    if (course.status === 0) {
      // 删除推送记录
      await PushController.delCoursePush(uid, courseid)

      const infoResult: any[] = await this.getInfoForNotify(uid, tid, courseid)
      const info = R.head(infoResult)
      if (info) {
        // 发送课程删除的通知邮件
        await MailController.sendCourseRemoveMail(info)
        // 钉钉通知
        await SMSController.sendDelClassSMS(info)
        // 更新任务 -1状态
        await MissionsController.updateMissionStatus(uid, tid, courseid, -1)
      }
    }
    // FIXME: 给我用户信息
    const user: any = {}
    LogController.logSession(
      undefined,
      user.userName || "Student",
      "course manage",
      "course/giveUp",
      uid,
      `giveUp # uid:${uid} game_couse.id:${courseid} # set mission status = -1  # giveUpUser:vincent # changTime:${moment
        .tz(parseInt(moment().format("x")), "Asia/Shanghai")
        .format("Y-M-D H:m")}`
    )
  }

  /**
   * 放弃24小时内的正式课
   *
   * @static
   * @param {number} sid
   * @memberof ClassRecordsController
   */
  static async giveUpOfficialCourse(sid: number) {
    // 1. 查询是否还有这个课
    const course = await this.getCourseInfoBySid(sid)

    //
    // 因为只是放弃了这周的,所有gcs表不变状态,只是更新任务表状态
    const { courseid, uid, tid, timeLine, next_available_ts } = course
    // 更新任务 -1状态
    await MissionsController.updateMissionStatus(
      uid,
      tid,
      courseid,
      -1,
      timeLine
    )
    // 下面必须完全复制逻辑,否则 giveup相关数据都跑不通,都在redis里
    let courseTime = next_available_ts
    if (
      next_available_ts + 30 * 60 - 7 * 86400 > moment().unix() &&
      next_available_ts - 7 * 86400 < moment().unix()
    ) {
      courseTime = courseTime - 7 * 86400
    }
    const expire_time =
      courseTime + 1800 - moment().unix() < 0
        ? 1500
        : courseTime + 1800 - moment().unix()
    redis.setex(`course_give_up_${sid}`, expire_time, 1)
    //为了获取老师的课程是否有放弃当前标识
    redis.setex(
      `course_give_up_course_id_tid_${courseid}_${tid}`,
      expire_time,
      1
    )
    // FIXME: 给我用户信息
    const user: any = {}
    LogController.logSession(
      user.usrId,
      user.userName || "Student",
      "course manage",
      "course/giveUp",
      uid,
      `giveUp # uid:${uid} game_couse.id:${courseid} # set mission status = -1  # giveUpUser:vincent # changTime:${moment
        .tz(parseInt(moment().format("x")), "Asia/Shanghai")
        .format("Y-M-D H:m")}`
    )
  }

  /**
   * 系统内的代课-临时调整一个课的时间或者老师,原课会被设为请假状态,新建一个课
   * demo课不能代课,所以不用判断demo
   *
   * @static
   * @memberof ClassRecordsController
   */
  static async tempAdjustCourse(
    sid: number,
    tid: number,
    week: number,
    start: string,
    uid: number,
    zone: string
  ) {
    // 需改进为Promise.all
    // 时间是否在假期内
    const isInHoliday: boolean = R.head(
      await HolidayController.isInHolidayByCourseIdQuery(null, {
        week,
        start,
        tid
      })
    )
    if (isInHoliday) {
      throw new Error("放假期间不允许约课!")
    }
    // 检查老师是否存在
    const teacherInfo: any = R.head(
      await TeachersController.getAllTeacherInfo(tid)
    )
    if (!teacherInfo) {
      throw new Error("老师不存在")
    }
    const isStudentOnLeave = R.head(
      await LeavesController.isStudentOnLeaveByCourseIdQuery(uid, week, start)
    )
    if (isStudentOnLeave) {
      throw new Error("学生长时间请假期间不允许约课!")
    }
    const isPlaceholderStu = String(uid).length === 11
    let studentInfo: any = {}
    if (!isPlaceholderStu) {
      studentInfo = R.head(await StudentController.getStudentAllInfo(uid))
    } else {
      throw new Error("占位课不能代课")
      // studentInfo = R.head(await UserController.getUserDetailInfo(uid))
    }
    console.log(teacherInfo, "teacher info")

    console.log("student info", studentInfo)
    const tempAvaialbleTeachers = await LeavesController.getStudentLeaveAffectTids()
    if (R.contains(tid, tempAvaialbleTeachers)) {
      throw new Error("临时空闲出来的老师只能约demo课")
    }
    // 获取老师空闲时间,可用sql优化
    const availableTeacherQuery: any[] = await this.getAvailbelTeachers({
      page: 1,
      pageSize: 0,
      week,
      all: false
    })

    const availabelTeacher = R.find(
      R.propEq("cn_start", start) && R.propEq("tid", tid)
    )(availableTeacherQuery)
    if (!availabelTeacher) {
      throw new Error("老师在这个时间段没有空闲时间")
    }

    // 学生的调课次数不能>=12次
    // FIXME: 临时调整数据需要想办法入库
    const changeTmpCourseCount = await redis.get(`changeTmpCourseCount${uid}`)
    console.log(changeTmpCourseCount)
    // FIXME: 给我登录用户信息
    const user: any = {}
    if ((changeTmpCourseCount || 0) >= 12 && !user.userName) {
      throw new Error("临时调整次数达到上限")
    }

    // 约课在黄金时段并且约的是高销售老师- 判断约课率
    if (this.isCourseInBusyTime(start) && parseInt(teacherInfo.isHighSales)) {
      const busyTimeArr: any[] = await SummaryController.teacherCourseSummaryByWeekday(
        tid,
        week
      )

      const total = busyTimeArr.filter(i => this.isCourseInBusyTime(i.cn_start))
      const offiailCourses = total.filter(i => i.cPay > 2000)
      if ((offiailCourses.length + 1) / total.length * 100 > 50) {
        throw new Error(
          "老师在本时间分配给正式课的时间已经约满，不能再约正式课！"
        )
      }
    }

    //判断是否还有课时
    let completed_times = 0
    let courseCounts = 0
    let teacherType = "外教"
    if (!parseInt(teacherInfo["tBilligual"])) {
      completed_times = studentInfo["used_tutor_course"]
      courseCounts = studentInfo["tutorCount"]
      teacherType = "外教"
    } else {
      completed_times = studentInfo["used_star_course"]
      courseCounts = studentInfo["starCount"]
      teacherType = "小明星"
    }
    if (completed_times > 0 && studentInfo["regTime"] < 1488297600) {
      completed_times = completed_times - 1
    }

    if (completed_times >= courseCounts) {
      throw new Error(
        `该学生Regular课时数为:${courseCounts}，已经上过：${completed_times} 次，请学生续费后再约！`
      )
    }
    // logs

    //   if (!$placeholder_course && (intval($completed_times) >= $courseCounts) && $user_info['cPay'] >= 2000) {
    //     disk_logs("course_model/add_course", [
    //         "续费后再约课",
    //         $uid,
    //         $user_info['courseCount'],
    //         $completed_times
    //     ]);
    //     return array(1010, "该学生".$tType."课时数为：" . $courseCounts . "，已经上过：{$completed_times} 次，请学生续费后再约！");
    // } elseif(!$placeholder_course) {
    //     disk_logs("course_model/add_course", [
    //         "课时数",
    //         $uid,
    //         $user_info['courseCount'],
    //         $completed_times
    //     ]);
    // }

    const courseArr: any[] = await dataDB
      .select("gcv.id", "gcv.next_available_ts")
      .from("game_course_view as gcv")
      .where({
        "gcv.week": week,
        "gcv.start": removeLeftPaddingTime(start),
        zone: zone
      })

    const courseInfo = R.head(courseArr)
    const oldCourseInfo = await this.getCourseInfoBySid(sid)
    // 避免并发操作 - 准备各种入库操作
    // debugger
    // return
    const lockt = await redis.get(`add_course_lock:${tid}:${courseInfo.id}`)
    const locku = await redis.get(`add_course_lock:${uid}:${courseInfo.id}`)
    if (locku || lockt) {
      throw new Error("改教师或者同时添加人数过多！请稍后再试！")
    }

    await redis.setex(`add_course_lock:${tid}:${courseInfo.id}`, 3, 1)
    await redis.setex(`add_course_lock:${uid}:${courseInfo.id}`, 3, 1)

    // 更新mission状态
    // 设置状态为 0 - 删除
    await MissionsController.updateMissionStatus(
      oldCourseInfo.uid,
      oldCourseInfo.tid,
      oldCourseInfo.courseid,
      0
    )
    // 插入老师,学生两条新mission
    await MissionsController.insertMissionRecord(courseInfo, uid, tid)

    // 写日志
    //  const logmsg = `uid:$uid tid:${tid} courseid:${courseid} statusCode:0 isShow:0`
    // LogController.logSession(
    //   user.userId,
    //   user.userName,
    //   "更新任务状态",
    //   "course_model/up_course_mission_status",
    //   uid,
    //   logmsg
    // )

    // 插入game_course_s 课表
    const newSid = await this.insertClassRecord(courseInfo, user, uid, tid)

    //FIXME:发通知-需要独立出去
    //   if(newSid) {
    //     $send_ids = [];
    //     $newCourseInfo = $this->get_course_info_by_sid($opt);

    //     $send_ids[$uid]['refreshMission'] = 1;
    //     $send_ids[$tid]['refreshMission'] = 1;
    //     $this->load->model('app_model');
    //     $this->app_model->changeClass($send_ids);
    // }

    // $this->logger_model->log_session('course manage', 'course/select_course', $uid, "ADD COURSE # teacher:{$teacher_info['name']}/$tid # user:{$user_info['name']}/$uid # game_course.id:$courseid  # addCourseTime:" . date("Y-m-d H:i"));

    // 设置被调整的旧课程标记

    const oldCourseTs = oldCourseInfo.next_available_ts
    if (oldCourseTs - 60 * 60 * 24 * 7 > moment().unix()) {
      // 被调整的课时下周的
      const preList = await redis.get("changeCourseTmpNextWeekList")
      const curList = (preList || "[]").concat(String(sid))
      await redis.set("changeCourseTmpNextWeekList", JSON.stringify(curList))
    } else {
      // 被调整的是本周的课
      const preList = await redis.get("changeCourseTmpList")
      const curList = (preList || "[]").concat(String(sid))
      await redis.set("changeCourseTmpList", JSON.stringify(curList))
    }

    // 设置调整后的课程标记
    const curCourseTs = courseInfo.next_available_ts

    if (curCourseTs - 60 * 60 * 24 * 7 > moment().unix()) {
      // 调整的课时下周的
      const preList = await redis.get("courseTmpNextWeekList")
      const curList = (preList || "[]").concat(String(newSid))
      await redis.set("courseTmpNextWeekList", JSON.stringify(curList))
    } else {
      // 调整的是本周的课
      const preList = await redis.get("courseTmpList")
      const curList = (preList || "[]").concat(String(newSid))
      await redis.set("courseTmpList", JSON.stringify(curList))
    }

    // 调课次数更新 +1
    redis.incr(`changeTmpCourseCount${oldCourseInfo.uid}`)
    const changeUser = user.userName || "Student"
    // log
    //  $this->logger_model->log_session('course manage', 'course/changTmpCourse', $courseInfo['uid'],
    //  "changTmpCourse # chang sid:$sid tmp course sid:$insertSid uid:{$courseInfo['uid']} game_couse.id:{$courseInfo['courseid']} #  # adminUser:$changUser # changTime:"
    //  . date("Y-m-d H:i"));

    // 取消课程短信通知 oldCourseInfo
    // 独立服务
  }

  /**
   * 判断是否在黄金时间内
   *
   * @static
   * @param {string} start  开始时间 ex.09:30
   * @returns {boolean}
   * @memberof ClassRecordsController
   */
  static isCourseInBusyTime(start: string): boolean {
    moment.tz.setDefault("Asia/Shanghai")
    const busyStart = moment(
      `${moment().format("YYYY-MM-DD")} ${busyTime.start}`,
      "YYYY-MM-DD hh:mm"
    ).unix()

    const busyEnd = moment(
      `${moment().format("YYYY-MM-DD")} ${busyTime.end}`,
      "YYYY-MM-DD HH:mm"
    ).unix()
    const current = moment(
      `${moment().format("YYYY-MM-DD")} ${start}`,
      "YYYY-MM-DD HH:mm"
    ).unix()
    return current >= busyStart && current <= busyEnd
  }

  /**
   * 插入约课记录
   * game_course_s
   *
   * @static
   * @param {number} courseid
   * @param {number} uid
   * @param {number} tid
   * @memberof ClassRecordsController
   */
  static async insertClassRecord(
    courseInfo: any,
    user: any,
    uid: number,
    tid: number
  ) {
    let userInfo: any = R.head(await UserController.getUserRegistInfo(uid))
    if (!userInfo) {
      if (String(uid).length === 11) {
        // 占位课
        userInfo["db"] = 1
        userInfo["country"] = 0
      } else {
        throw new Error("未找到学生记录")
      }
    }

    // 插入状态 0 - 正常
    const recordData = {
      uid,
      tid,
      courseid: courseInfo.id,
      scountry: userInfo.country,
      status: 0,
      timeline: courseInfo.next_available_ts,
      adminUser: user.userName || user.changeName || "用户修改",
      create_time: moment().unix()
    }
    const newSid = R.head(await dataDB("game_course_s").insert(recordData))

    //  更新game_course表格里面的选课学生数，
    // FIXME:因为这个要在算法里面用到?? 啥算法
    return await this.updateScount(courseInfo.id)

    // log
    // date_default_timezone_set('Asia/Shanghai');
    // disk_logs('Course_model/create_course_select_data', [
    //     $s_uid, $t_uid, date_s('Y-m-d H:i',$timeline)
    // ]);
  }
}
