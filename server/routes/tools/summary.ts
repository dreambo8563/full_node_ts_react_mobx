import * as express from "express"

import { ErrorEnum } from "../../const/error"
import Logger from "../../utils/logger"
import * as Response from "../../utils/response"
import { SummaryController } from "../../controllers/summaryController"

const router = express.Router()

router.get("/wxdemogroup", async (req, res) => {
  const { startDate, endDate } = req.query
  try {
    if (!startDate || !endDate) {
      return Response.reponseErrorMsg(res, ErrorEnum.ParamError)
    } else {
      await SummaryController.getWXDemoGroupChartData(
        {
          req,
          res
        },
        parseInt(startDate),
        parseInt(endDate)
      )
    }
  } catch (error) {
    Logger(
      "summary - /wxdemogroup",
      {
        ...req.query
      },
      error.message
    )
    Response.reponseErrorMsg(res, ErrorEnum.GetDataFail)
  }
})

export default router
