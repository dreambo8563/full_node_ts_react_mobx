import { Config } from "../config"

export const wxTemplateAPI = `${
  Config().serverName.wxtools
}/?c=crontab&m=send_class_msg`
