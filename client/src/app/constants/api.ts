import { qs } from "../utils/http"

// 老师空间时间
export const availableTimeListAPI = query =>
  qs(`/api/tools/teachers/availabletimes`, query)

// 所有已约课程记录
export const courseSubscribeListAPI = (query: object) =>
  qs(`/api/tools/courses`, query)

// 删除课程
export const delCourseAPI = sid => `/api/tools/courses/${sid}`
// 课程提前请假
export const takeLeaveOnCourseAPI = sid => `/api/tools/courses/leaves/${sid}`

// 老师请某节课的假
export const takeLeaveOnCourserForTeacherAPI = sid =>
  `/api/tools/courses/leaves/teacher/${sid}`
// 老师请假列表
export const teacherLeaveListAPI = (query: object) =>
  qs(`/api/tools/teachers/leaves`, query)

// 放弃demo课
export const giveupDemoAPI = sid => `/api/tools/courses/giveup/demo/${sid}`
// 放弃24小时内正式课
export const giveupOfficialAPI = sid =>
  `/api/tools/courses/giveup/official/${sid}`

// 代课
export const tempAdjustCourseAPI = sid => `/api/tools/courses/${sid}`

// 课程报表

export const getFirstClassTimeAPI = query =>
  qs(`/api/tools/courses/firstclass`, query)

export const getLastestCourseReportAPI = (id, query) =>
  qs(`/api/wx/report/officialreport/${id}`, query)

export const getPreviewReportDataAPI = query =>
  qs(`/api/wx/report/officialreport/search`, query)

export const createReportAPI = (query: { name: string }) =>
  qs(`/api/wx/report/officialreport`, query)

// 图表汇总
// 上课时的网络情况
export const getNetworkAPI = (query: object) =>
  qs(
    `/api/tools/courses/monitor/network`,
    query
  )

// 上课时老师/学生端上报的错误数据
export const getErrorListOnCourseAPI = (query: object) =>
  qs(`/api/tools/courses/monitor/errlog`, query)

export const getDingDemoGroupAPI = (query: object) =>
  qs(`/api/tools/summary/wxdemogroup`, query)

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 通用接口

// 老师autoComplete
export const teacherAutoCompleteAPI = (query: object) =>
  qs(`/api/tools/common/teachers`, query)
