import { Config } from "../config"

export const wxOfficialReportURl = (name: string) =>
  `${Config().serverName.wxtools_node}/report/stage/?name=${name}`
