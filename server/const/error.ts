export const ErrorEnum = {
  ParamError: {
    code: -1000,
    message: "参数错误"
  },
  ReportPreviewError: {
    code: -1001,
    message: "预览报表错误"
  },
  NoOfficialRecords: {
    code: -1002,
    message: "此用户没有任何正式课信息"
  },
  NotFoundUser: {
    code: -1003,
    message: "未找到这个用户"
  },
  GetReportError: {
    code: -1004,
    message: "获取报表错误"
  },
  CreateReportError: {
    code: -1005,
    message: "生成报表错误"
  },
  LeavesListError: {
    code: -1006,
    message: "获取请假列表失败"
  },
  GetDataFail: {
    code: -1007,
    message: "获取数据失败,请刷新页面"
  }
}
