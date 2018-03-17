import { action, computed, observable, runInAction } from "mobx"
import { Moment } from "moment"
import moment from "moment"

import { getNetworkAPI } from "../../../../constants/api"
import { httpGet, httpPost } from "../../../../utils/http"

export class MonitorNetworkStore {
  @observable public studentData: any[] = [] // 学生数据
  @observable public teacherData: any[] = [] // 老师数据
  @observable public studentTxPie: any[] = []
  @observable public studentRxPie: any[] = []

  @observable public teacherRxPie: any[] = []
  @observable public teacherTxPie: any[] = []
  @observable public uid: number
  @observable public tid: number
  @observable public classTime: number
  @action
  public getNetwork(query: any) {
    httpGet(getNetworkAPI(query)).then(res => {
      if (res) {
        runInAction(() => {
          this.studentData = res.data.data.studentData
          this.teacherData = res.data.data.teacherData
          this.studentRxPie = res.data.data.studentRxPie
          this.studentTxPie = res.data.data.studentTxPie
          this.teacherRxPie = res.data.data.teacherRxPie
          this.teacherTxPie = res.data.data.teacherTxPie
        })
      }
    })
  }
  @action
  public setParams(uid: number, tid: number, classTime: number) {
    this.uid = uid
    this.tid = tid
    this.classTime = classTime
    this.getNetwork({
      tid,
      uid,
      class_time: classTime
    })
  }
}

export default MonitorNetworkStore
