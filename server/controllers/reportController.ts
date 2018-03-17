import * as moment from "moment"
import * as momentTZ from "moment-timezone"
import R = require("ramda")
import { Config } from "../config"
import { ErrorEnum } from "../const/error"
import {
  ReportTypeEnum,
  zoneArray,
  CourseTypeEnum,
  NetworkConditionErrors,
  NetworkPieCategory
} from "../const/text"
import DB from "../db"
import {
  CourseHistoryServices,
  ReportHistoryServices
} from "../service/history"
import { UserServices } from "../service/user"
import { LogServices } from "../service/log"
import * as Response from "../utils/response"
import { WxServices } from "../service/wx"
import { wxOfficialReportURl } from "../const/url"
import logger from "../utils/logger"
import {
  NewFeedbackStartTime,
  LogLevel,
  NetworkConditionWarnings
} from "../const/text"

const dataDB = DB.getInstance()
export class ReportController {
  static async officialReport(
    context: {
      req: Express.Request
      res: Express.Response
    },
    appName: string,
    startT: number,
    endT: number
  ) {
    moment.tz.setDefault("Asia/Shanghai")
    const name = appName
    const scoreRecords: any[] = await CourseHistoryServices.getOfficialCourseRecordsWithFeedbackByName(
      name,
      ["gce.option_info", "gch.time_frame", "gur.id", "gch.lesson"]
    )

    const firstRecord: any = R.head(
      await CourseHistoryServices.getTimeForFirstClass(name, 1)
    )
    if (!firstRecord) {
      return Response.reponseErrorMsg(context.res, ErrorEnum.NoOfficialRecords)
    }
    // 第一天上课日期 或者开始
    const firstTime = startT

    // 今天日期
    const today = endT

    // 相差多少天
    const days = moment.unix(today).diff(moment.unix(firstTime), "days")
    // const endOfThisMonth = moment
    //   .unix(today)
    //   .endOf("months")
    //   .unix()

    // 月份开始和结束的日期
    let start: number[] = []
    let end: number[] = []
    start.push(firstTime)
    // console.log(
    //   moment.unix(firstTime).format("YYYY-MM-DD HH:mm:ss"),
    //   moment
    //     .unix(firstTime)
    //     .endOf("months")
    //     .unix()
    // )
    end.push(
      Math.min(
        moment
          .unix(firstTime)
          .endOf("months")
          .unix(),
        today
      )
    )

    let tem = Math.min(
      moment
        .unix(firstTime)
        .endOf("months")
        .unix(),
      today
    )
    while (tem + 1 <= today) {
      start.push(tem + 1)
      end.push(
        Math.min(
          moment
            .unix(tem + 1)
            .endOf("months")
            .unix(),
          today
        )
      )
      tem = Math.min(
        moment
          .unix(tem + 1)
          .endOf("months")
          .unix(),
        today
      )
    }
    const pArr = start.map((v, i) =>
      CourseHistoryServices.courseCountByName(v, end[i], name)
    )
    const result: { num: number }[][] = await Promise.all(pArr)
    const countArr = result.map(v => R.head(v).num)

    // 按月分割的数据组合
    const monthlyList = R.zipWith(
      (start, count) => ({ start, count }),
      start,
      countArr
    )
    // console.log(scoreRecords, "scoreRecords")
    // 评价评分计算
    let remarks: any = {}
    const avgList = scoreRecords.map((v, i) => {
      const list: any[] = JSON.parse(v.option_info)
      const avg =
        R.sum(
          list.map(m => {
            if (!remarks[m.about_us]) {
              remarks[m.about_us] = {}
            }
            remarks[m.about_us]["scores"] = remarks[m.about_us]["scores"]
              ? remarks[m.about_us]["scores"].concat(
                  parseInt(m.starLevel.starLevel)
                )
              : [parseInt(m.starLevel.starLevel)]

            remarks[m.about_us]["name"] = m.about_cn
            return parseInt(R.pathOr(0, ["starLevel", "starLevel"], m))
          })
        ) / list.length
      return {
        time_frame: v.time_frame,
        avg,
        id: v.id
      }
    })
    remarks = Object.keys(remarks).map(k => ({
      name: remarks[k].name,
      avgScore: R.sum(remarks[k].scores) / remarks[k].scores.length
    }))

    const currentClass: any = R.head(
      await CourseHistoryServices.getLatestRecord(name, 1)
    )
    // FIXME: 完成和老师迟到的都算,即使老师没给评价

    let remarksNum: number = 0
    if (NewFeedbackStartTime < firstTime) {
      remarksNum = R.head(<any[]>await CourseHistoryServices.getFeedbackTimes(
        name,
        firstTime,
        today
      )).num
    } else if (NewFeedbackStartTime > today) {
      const uid = await UserServices.getUserIdByName(name)
      remarksNum = R.head(
        <any[]>await CourseHistoryServices.getOldFeedbackTimes(
          uid,
          firstTime,
          today
        )
      ).num
    } else if (
      NewFeedbackStartTime >= firstTime &&
      NewFeedbackStartTime <= today
    ) {
      const uid = await UserServices.getUserIdByName(name)
      remarksNum =
        R.head(<any[]>await CourseHistoryServices.getFeedbackTimes(
          name,
          NewFeedbackStartTime,
          today
        )).num +
        R.head(<any[]>await CourseHistoryServices.getOldFeedbackTimes(
          uid,
          firstTime,
          NewFeedbackStartTime
        )).num
    }

    // 等级 区分新旧课程体系
    let level = parseInt(
      currentClass.lesson.substring(
        currentClass.lesson.indexOf("L") + 1,
        currentClass.lesson.indexOf("U")
      ),
      10
    )
    if (!parseInt(currentClass.ver_id)) {
      level = parseInt(String(level).slice(0, 1))
    }

    Response.reponseData(context.res, {
      startTime: firstTime,
      endTime: today,
      monthlyList,
      days,
      remarksNum,
      remarks,
      avgList,
      level
    })
  }

  // 生成报表,入库game_report_history
  static async createOfficialReport(
    context: {
      req: Express.Request
      res: Express.Response
    },
    info: any,
    userName: string
  ) {
    const uid: number = R.head(await UserServices.getUserIdByName(userName))
    if (!uid) {
      return Response.reponseErrorMsg(context.res, ErrorEnum.NotFoundUser)
    }
    const insertId = await ReportHistoryServices.insertHistoryRecord({
      name: `${info.startTime}-${info.endTime}`,
      report_id: ReportTypeEnum.OfficialCourseReport,
      created_time: moment().unix(),
      report_data: JSON.stringify(info),
      uid
    })

    // 发送wx模板
    WxServices.pushTemplate(
      userName,
      "5p-VR7gOBvYvFuF-6jCL0ys4_MA3KpW5U9AYI4G4w64",
      wxOfficialReportURl(userName),
      {
        first:
          "嗨！您家宝贝最新一次的阶段学习报告已新鲜出炉啦！快来看看孩子取得的进步吧",
        keyword1: uid,
        keyword2: userName,
        remark: "呤呤英语祝小朋友在这里学习进步，收获成长，收获喜悦"
      }
    )

    Response.reponseData(context.res, { insertId: R.head(insertId) })
  }

  // 获取某个id的报告
  static async getOfficialReportById(
    context: {
      req: Express.Request
      res: Express.Response
    },
    id: number
  ) {
    const reports = await ReportHistoryServices.getReportHistoryById(
      id,
      ReportTypeEnum.OfficialCourseReport
    )
    Response.reponseData(context.res, {
      result: reports
    })
  }

  // 获取某个用户的最新的这个报告
  static async getOfficialLatestReport(
    context: {
      req: Express.Request
      res: Express.Response
    },
    name: string,
    type: number
  ) {
    const uid = R.head(await UserServices.getUserIdByName(name))
    if (!uid) {
      return Response.reponseErrorMsg(context.res, ErrorEnum.NotFoundUser)
    }
    const data = await ReportHistoryServices.getLatestReportHistory(
      ReportTypeEnum.OfficialCourseReport,
      {
        uid
      }
    )

    Response.reponseData(context.res, data)
  }

  /**
   * 通过姓名获取这个学生第一节课的时间
   *
   * @static
   * @param {{
   *       req: Express.Request
   *       res: Express.Response
   *     }} context
   * @param {string} name
   * @returns
   * @memberof ReportController
   */
  static async getTimeForFirstClass(
    context: {
      req: Express.Request
      res: Express.Response
    },
    name: string
  ) {
    const userInfo = R.head(
      await CourseHistoryServices.getTimeForFirstClass(
        name,
        CourseTypeEnum.OfficialCourse
      )
    )
    if (!userInfo) {
      return Response.reponseErrorMsg(context.res, ErrorEnum.NoOfficialRecords)
    }
    Response.reponseData(context.res, userInfo)
  }

  /**
   * 获取某节课的网络状况数据,数据来自app
   *
   * @static
   * @param {{
   *       req: Express.Request
   *       res: Express.Response
   *     }} context
   * @param {number} uid
   * @param {number} tid
   * @param {number} classTime
   * @memberof ReportController
   */
  static async getNetworkData(
    context: {
      req: Express.Request
      res: Express.Response
    },
    uid: number,
    tid: number,
    classTime: number
  ) {
    const rxLevelFunc = R.groupBy((v: any) => v.rx_level)
    const txLevelFunc = R.groupBy((v: any) => v.tx_level)
    const studentData = await LogServices.getNetworkDataForCourse(
      uid,
      uid,
      tid,
      classTime
    )
    const studentRxLevelObj = rxLevelFunc(studentData)
    const studentRxPie = Object.keys(studentRxLevelObj).map(key => {
      return {
        value: studentRxLevelObj[key].length,
        name: NetworkPieCategory[key]
      }
    })
    const studentTxLevelObj = txLevelFunc(studentData)
    const studentTxPie = Object.keys(studentTxLevelObj).map(key => {
      return {
        value: studentTxLevelObj[key].length,
        name: NetworkPieCategory[key]
      }
    })
    const teacherData = await LogServices.getNetworkDataForCourse(
      tid,
      uid,
      tid,
      classTime
    )
    const teacherRxLevelObj = rxLevelFunc(teacherData)
    const teacherRxPie = Object.keys(teacherRxLevelObj).map(key => {
      return {
        value: teacherRxLevelObj[key].length,
        name: NetworkPieCategory[key]
      }
    })
    const teacherTxLevelObj = txLevelFunc(teacherData)
    const teacherTxPie = Object.keys(teacherTxLevelObj).map(key => {
      return {
        value: teacherTxLevelObj[key].length,
        name: NetworkPieCategory[key]
      }
    })

    Response.reponseData(context.res, {
      studentData,
      studentRxPie,
      studentTxPie,
      teacherData,
      teacherTxPie,
      teacherRxPie
    })
  }

  /**
   * 获取某节课的错误日志
   *
   * @static
   * @param {{
   *       req: Express.Request
   *       res: Express.Response
   *     }} context
   * @param {number} uid
   * @param {number} tid
   * @param {number} classTime
   * @param {{
   *       target: number
   *       type?: number
   *     }} filter
   * @memberof ReportController
   */
  static async getErrorLogList(
    context: {
      req: Express.Request
      res: Express.Response
    },
    uid: number,
    tid: number,
    classTime: number,
    filter: {
      target: number
      type?: number
    }
  ) {
    const source = filter.target
    const type = filter.type

    const logs = await LogServices.getErrorLogForCourse(uid, tid, classTime, {
      source,
      type
    })

    Response.reponseData(
      context.res,
      logs.map((v: any) => {
        if (parseInt(v.type) === LogLevel.Warning) {
          return { ...v, error_msg: NetworkConditionWarnings[v.error_code] }
        }
        if (parseInt(v.type) === LogLevel.Error) {
          return { ...v, error_msg: NetworkConditionErrors[v.error_code] }
        }
        return v
      })
    )
  }
}
