import * as express from "express"
import * as R from "ramda"

import { ErrorEnum } from "../../const/error"
import { ReportTypeEnum } from "../../const/text"
import { ReportController } from "../../controllers/reportController"
import Logger from "../../utils/logger"
import * as Response from "../../utils/response"

const ErrorMessage = Response.ErrorMessage

const router = express.Router()

// 按名字日期搜索报表
router.get("/officialreport/search", async (req, res) => {
  // search by query
  const { name, start, end } = req.query
  try {
    if (!name || !start || !end) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    }
    await ReportController.officialReport(
      { req, res },
      name,
      parseInt(start),
      parseInt(end)
    )
  } catch (error) {
    // error on get info
    Logger(
      "report -/officialreport/search",
      {
        name,
        start,
        end
      },
      error.message
    )
    return Response.reponseErrorMsg(res, ErrorEnum.ReportPreviewError)
    // Response.respondJSON(res, false, error.message)
  }
})

// 获取最新的报表或者某id的报表
router.get("/officialreport/:id", async (req, res) => {
  // search by query
  const { id } = req.params
  const { name } = req.query
  let result = {}
  try {
    if (!name || !id) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    }

    if (String(id) == "latest") {
      await ReportController.getOfficialLatestReport(
        { req, res },
        name,
        ReportTypeEnum.OfficialCourseReport
      )
    } else if (isNaN(id)) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    } else {
      await ReportController.getOfficialReportById({ req, res }, parseInt(id))
    }
  } catch (error) {
    // error on get info
    Logger(
      "report - /officialreport/:id",
      {
        id: req.params.id,
        name: req.query.name
      },
      error.message
    )
    return Response.reponseErrorMsg(res, ErrorEnum.GetReportError)
  }
})

// 创建报表
router.post("/officialreport", async (req, res) => {
  // 生成报表,入库game_report_history
  const { name } = req.query
  try {
    if (
      !name ||
      R.isEmpty(req.body) ||
      R.isNil(req.body.startTime) ||
      R.isNil(req.body.endTime)
    ) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    }
    await ReportController.createOfficialReport({ req, res }, req.body, name)
    //  Response.respondJSON(res, true, result)
  } catch (error) {
    // error on get info
    Logger(
      "report - /officialreport",
      {
        name: req.query.name,
        body: req.body
      },
      error.message
    )
    // Response.respondJSON(res, false, error.message)
    return Response.reponseErrorMsg(res, ErrorEnum.CreateReportError)
  }
})

export default router
