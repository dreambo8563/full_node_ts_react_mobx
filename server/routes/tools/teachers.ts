import * as express from "express"
import * as R from "ramda"

import { ErrorEnum } from "../../const/error"
import { ClassRecordsController } from "../../controllers/classRecordsController"
import { LeavesController } from "../../controllers/leavesController"
import Logger from "../../utils/logger"
import * as Response from "../../utils/response"

const router = express.Router()

router.get("/leaves", async (req, res) => {
  // search by query
  const { page, pageSize, keyword, start, end, status } = req.query
  try {
    if (isNaN(parseInt(start)) || isNaN(parseInt(end))) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    }
    const config = {
      page: page || 1,
      pageSize: pageSize || 20,
      keyword: keyword || "",
      start: parseInt(start),
      end: parseInt(end),
      status: status,
      all: false
    }

    await LeavesController.getTutorLeavesList(
      {
        req,
        res
      },
      config
    )
  } catch (error) {
    Logger(
      "teachers - /leaves",
      {
        ...req.query
      },
      error.message
    )
    Response.reponseErrorMsg(res, ErrorEnum.LeavesListError)
  }
})

// ~~~~~~~~~~~~~~~~~~~待重构
router.get("/availabletimes", async (req, res) => {
  // search by query
  try {
    const [teachers, counts] = await Promise.all([
      ClassRecordsController.getAvailbelTeachers({
        page: req.query.page,
        pageSize: req.query.pageSize,
        week: parseInt(req.query.currentWeek),
        all: false
      }),
      ClassRecordsController.getAvailbelTeachers({
        page: req.query.page,
        pageSize: req.query.pageSize,
        week: parseInt(req.query.currentWeek),
        all: true
      })
    ])
    // const nwT = teachers.map(t => {
    //   return `${t.tid}${t.cn_start}-${t.cn_end}`
    // })
    Response.respondJSON(res, true, {
      list: teachers,
      total: R.head(<any[]>counts).total
    })
  } catch (error) {
    // error on get info
    Response.respondJSON(res, false, error.message)
  }
})

export default router
