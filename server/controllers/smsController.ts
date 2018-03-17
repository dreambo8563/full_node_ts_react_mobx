export class SMSController {
  /**
   * 删除课程后发送钉钉消息
   *
   * @static
   * @param {*} info
   * @memberof SMSController
   */
  static async sendDelClassSMS(info: any) {
    const { local_day, local_time } = info
    const $message = `SnapLingo lesson cancelled at ${local_day} ${local_time}`

    // FIXME: 给钉钉发消息 独立服务
  }
}
