import axios from "axios"
import { wxTemplateAPI } from "../const/api"
import Logger from "../utils/logger"
import * as querystring from "querystring"
export class WxServices {
  /**
   * 微信模板推送
   *
   * @static
   * @param {string} name
   * @param {string} templateId
   * @param {string} actionUrl
   * @param {*} data
   * @memberof WxServices
   */
  static pushTemplate(
    name: string,
    templateId: string,
    actionUrl: string,
    data: any
  ) {
    axios
      .post(
        wxTemplateAPI,
        querystring.stringify({
          user: name,
          template_id: templateId,
          act_url: actionUrl,
          ...data
        })
      )
      .then(res => {
        if (res.data.status.code != 1) {
          Logger(
            "WxServices - pushTemplate",
            {
              name,
              templateId,
              actionUrl,
              data
            },
            res.data.status.msg
          )
        }
      })
      .catch(e => {
        Logger(
          "WxServices - pushTemplate",
          {
            name,
            templateId,
            actionUrl,
            data
          },
          e.message
        )
      })
  }
}
