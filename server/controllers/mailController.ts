export class MailController {
  /**
   * 发送删除课程的通知邮件
   *
   * @static
   * @param {*} info
   * @memberof MailController
   */
  static async sendCourseRemoveMail(info: any) {
    let courseType = "Regular"
    if (info) {
      if (String(info.mid).substr(-4) === "demo") {
        courseType = "Demo"
      }
      const { t_name, local_day, local_time } = info

      const subject_mail = `Removed: ${t_name} on ${local_day} at ${local_time} a ${courseType} lesson.`
      const message_mail = subject_mail
      // FIXME: 显示的时区? 发邮件服务应该独立出去
      //   @$this->sms_model->send_mail('snaplingo.admin@greenes.org.uk', $subject_mail, $message_mail);
      //   @$this->sms_model->send_mail('tutor@snaplingo.com', $subject_mail, $message_mail);
    }
  }
}
