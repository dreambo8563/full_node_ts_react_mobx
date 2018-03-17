import { action, computed, observable, runInAction } from "mobx"
import { Moment } from "moment"
import moment from "moment"

import {
  createReportAPI,
  getFirstClassTimeAPI,
  getLastestCourseReportAPI,
  getPreviewReportDataAPI
} from "../../../../constants/api"
import { httpGet, httpPost } from "../../../../utils/http"

export class StageReportStore {
  @observable public name: string // 用户名
  @observable public firstTime: number // 第一次上正式课的时间
  @observable public uid: number // 用户id
  @observable public reportData: any // 报告数据

  @observable public end: number | undefined = undefined
  @observable public start: number | undefined = undefined

  @computed
  get hours() {
    let sum = 0
    const numArr = ((this.reportData || {}).monthlyList || []).map(v => v.count)
    for (const num of numArr) {
      sum += num
    }
    const count = sum / 2
    return count
  }
  @computed
  get remarkList() {
    const remarkss = (this.reportData || {}).remarks || []
    const remarks = []
    remarkss.map((v, i, arr) => {
      if (v.avgScore && v.name) {
        remarks.push(v)
      }
    })
    if (remarks.length > 5) {
      const arr = []
      const remarksArr = []
      while (arr.length < 5) {
        const randomnumber = Math.floor(Math.random() * remarks.length)
        if (arr.indexOf(randomnumber) > -1) {
          continue
        }
        arr[arr.length] = randomnumber
        const num = remarks[randomnumber].avgScore
        remarksArr.push(
          remarks[randomnumber]
        )
      }
      return remarksArr
    } else {
      return remarkss
    }
  }
  @action
  public setLeaveData = (start, end) => {
    this.start = start
    this.end = end
  }
  @action
  public setName(name: string) {
    this.name = name
  }

  @action
  public getFirstClassTime(name: string) {
    httpGet(
      getFirstClassTimeAPI({
        name
      })
    ).then(res => {
      if (res) {
        runInAction(() => {
          this.firstTime = res.data.data.time_frame
          this.uid = res.data.data.id
          if (!this.start) {
            this.start = res.data.data.time_frame
          }
          if (!this.end) {
            this.end = moment().unix()
          }
        })
      }
    })
  }

  @action
  public setMonth(m: Moment, type: string) {
    if (type === "start") {
      this.start = moment
      .unix(m.unix())
      .startOf("months")
      .unix()
    } else {
      this.end = Math.min(moment
        .unix(m.unix())
        .endOf("months")
        .unix(), moment().unix())
    }
  }

  @action
  public getLastestCourseReport() {
    httpGet(
      getLastestCourseReportAPI("latest", {
        name: this.name
      })
    ).then(res => {
      if (res) {
        runInAction(() => {
          if (res.data.data[0] && res.data.data[0].report_data) {
            const timeData = JSON.parse(res.data.data[0].report_data)
            this.start = timeData.startTime
            this.end = timeData.endTime
          }
          this.reportData = res.data.data[0]
            ? JSON.parse(res.data.data[0].report_data)
            : undefined
        })
      }
    })
  }

  @action
  public previewReport() {
    const data: any = {
      name: this.name
    }
    if (this.start) {
      data.start = this.start
    }
    if (this.end) {
      data.end = this.end
    }
    httpGet(getPreviewReportDataAPI(data)).then(res => {
      if (res) {
        runInAction(() => {
          this.reportData = res.data.data
          this.start = res.data.data.startTime
          this.end = res.data.data.endTime
        })
      }
    })
  }

  @action
  public createReport(cb: () => void) {
    httpPost(createReportAPI({ name: this.name }), {...this.reportData, remarks: this.remarkList}).then(
      res => {
        if (res) {
          cb()
        }
      }
    )
  }
}

export default StageReportStore
