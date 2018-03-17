interface IErrorType {
  code: number
  message: string
}

interface IReportHistoryRecord {
  name: string
  report_id: number
  created_time: number
  report_data: string
  uid: number
}
