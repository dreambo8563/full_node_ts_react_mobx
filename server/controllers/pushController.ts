import axios from "axios"

import { UserController } from "./userController"

export class PushController {
  /**
   * 删除课程的推送
   *
   * @static
   * @param {number} uid
   * @param {number} cid
   * @memberof PushController
   */
  static async delCoursePush(uid: number, cid: number) {
    // 获取用户信息
    const userInfo = await UserController.getUserRegistInfo(uid)
    axios.get(
      `http://wxtools.snaplingos.com/index.php?c=aws_act_api&m=del_Push_Class_Reminder_Data&uid=${
        userInfo.name
      }&cid=${cid}`
    )
  }
}
