import * as express from "express"
import * as Response from "../../utils/response"
import { InitController } from "../../controllers/initController"
const router = express.Router()
router.get("/", async (req, res) => {
  try {
    await InitController.saveStuLeavesIntoDB()
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})
router.get("/leaves/teacher", async (req, res) => {
  try {
    await InitController.saveTeacherLeavesIntoDB()
    Response.respondJSON(res, true, {})
  } catch (error) {
    Response.respondJSON(res, false, error.message)
  }
})

export default router
