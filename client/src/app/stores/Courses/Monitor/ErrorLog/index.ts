import { action, computed, observable, runInAction } from "mobx"
import moment from "moment"
import {
  getErrorListOnCourseAPI,
  teacherLeaveListAPI
} from "../../../../constants/api"
import { httpGet } from "../../../../utils/http"

export class CourseErrorStore {
  @observable public data: any[] = []
  @observable public type: number | undefined = undefined
  @observable public target: number = 1
  private uid: number
  private tid: number
  private classTime: number

  @action
  public async getLogList(query: object) {
    const res = await httpGet(getErrorListOnCourseAPI(query))
    if (res) {
      runInAction(() => {
        this.data = res.data.data
      })
    }
  }

  @action
  public setQuery(uid: number, tid: number, classTime: number) {
    this.uid = uid
    this.tid = tid
    this.classTime = classTime
  }

  @action
  public changeType(type: number | undefined) {
    this.type = type
    this.getLogList({
      uid: this.uid,
      tid: this.tid,
      classTime: this.classTime,
      target: this.target,
      type
    })
  }

  @action
  public changeTarget(target: number) {
    this.target = target
    this.getLogList({
      uid: this.uid,
      tid: this.tid,
      classTime: this.classTime,
      target,
      type: this.type
    })
  }
}

export default CourseErrorStore
