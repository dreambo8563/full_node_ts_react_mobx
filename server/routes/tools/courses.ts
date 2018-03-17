import * as express from "express"
import * as R from "ramda"

import * as Response from "../../utils/response"
import { uploader } from "../../utils/upload"
import { ClassRecordsController } from "../../controllers/classRecordsController"
import { LeavesController } from "../../controllers/leavesController"
import { ReportController } from "../../controllers/reportController"
import { ErrorEnum } from "../../const/error"
import Logger from "../../utils/logger"

const router = express.Router()

// 第一节正式课信息
router.get("/firstclass", async (req, res) => {
  const { name } = req.query
  try {
    if (!name) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    }
    await ReportController.getTimeForFirstClass({ req, res }, name)
  } catch (error) {
    Logger(
      "course - /firstclass",
      {
        name
      },
      error.message
    )
    return Response.reponseErrorMsg(res, ErrorEnum.NoOfficialRecords)
  }
})

// 某节课的网络状况
router.get("/monitor/network", async (req, res) => {
  const { class_time, uid, tid } = req.query
  try {
    if (!class_time || !uid || !tid) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    }
    await ReportController.getNetworkData(
      { req, res },
      parseInt(uid),
      parseInt(tid),
      parseInt(class_time)
    )
  } catch (error) {
    Logger(
      "course - /monitor/network",
      {
        uid,
        tid,
        class_time
      },
      error.message
    )
    return Response.reponseErrorMsg(res, ErrorEnum.GetDataFail)
  }
})

// 某节课的错误日志
router.get("/monitor/errlog", async (req, res) => {
  const { classTime, uid, tid, type, target } = req.query
  try {
    if (!classTime || !uid || !tid) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    }
    await ReportController.getErrorLogList(
      { req, res },
      parseInt(uid),
      parseInt(tid),
      parseInt(classTime),
      {
        target: parseInt(target),
        type
      }
    )
  } catch (error) {
    Logger(
      "course - /monitor/errlog",
      {
        uid,
        tid,
        classTime,
        type,
        target
      },
      error.message
    )
    return Response.reponseErrorMsg(res, ErrorEnum.GetDataFail)
  }
})

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~下面待重构
router.get("/", async (req, res) => {
  // search by query
  try {
    const { page, currentWeek, pageSize, type } = req.query
    const [courses, counts] = await Promise.all([
      ClassRecordsController.getPreservedClassRecords({
        page: parseInt(page),
        currentWeek: parseInt(currentWeek),
        pageSize: parseInt(pageSize),
        type: parseInt(type),
        all: false
      }),
      ClassRecordsController.getPreservedClassRecords({
        page: parseInt(page),
        currentWeek: parseInt(currentWeek),
        pageSize: parseInt(pageSize),
        type: parseInt(type),
        all: true
      })
    ])
    // console.log(momentTZ.tz(moment().valueOf(), "America/Toronto").format())
    Response.respondJSON(res, true, {
      list: courses,
      counts: R.head(<any[]>counts).count
    })
  } catch (error) {
    // error on get info
    Response.respondJSON(res, false, error.message)
  }
})

router.delete("/:sid", async (req, res) => {
  try {
    console.log(req.ip)
    await ClassRecordsController.delClassRoom(req.params.sid)
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})
router.put("/:sid", async (req, res) => {
  // 临时性调课-代课
  console.log(req)
  try {
    const { tid, week, start, uid, zone } = req.body
    const sid = parseInt(req.params.sid)
    await ClassRecordsController.tempAdjustCourse(
      sid,
      parseInt(tid),
      parseInt(week),
      start,
      parseInt(uid),
      zone || "Asia/Shanghai"
    )
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})
router.post("/giveup/demo/:sid", async (req, res) => {
  try {
    const sid = parseInt(req.params.sid)
    await ClassRecordsController.giveUpDemoCourse(sid)
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})

router.post("/giveup/official/:sid", async (req, res) => {
  try {
    const sid = parseInt(req.params.sid)
    await ClassRecordsController.giveUpOfficialCourse(sid)
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})
router.post("/leaves/teacher/:sid", async (req, res) => {
  try {
    const sid = parseInt(req.params.sid)
    const reason = req.body.reason
    await LeavesController.takeLeavesOnCourseForTeacher(sid, reason || "")
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})
router.post("/leaves/:sid", async (req, res) => {
  try {
    const sid = parseInt(req.params.sid)
    await LeavesController.takeLeaveOnCourse(sid)
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})

router.post("/upload", (req, res, next) => {
  uploader.single("file")(req, res, function(err) {
    if (err) {
      Response.respondJSON(res, false, err.message)
    } else {
      Response.respondJSON(res, true, {})
    }
  })
})

export default router
