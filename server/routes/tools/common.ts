import * as express from "express"
import * as R from "ramda"

import * as Response from "../../utils/response"
import { TeachersController } from "../../controllers/teachersControllers"

const router = express.Router()

router.get("/teachers", async (req, res) => {
  // search by query
  try {
    const { keywords } = req.query
    const result = await TeachersController.searchByKeywords(keywords)
    // console.log(momentTZ.tz(moment().valueOf(), "America/Toronto").format())
    Response.respondJSON(res, true, { list: result })
  } catch (error) {
    // error on get info
    Response.respondJSON(res, false, error.message)
  }
})

export default router
