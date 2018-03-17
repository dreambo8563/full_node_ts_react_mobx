import { action, computed, observable, runInAction } from "mobx"
import moment from "moment"
import { teacherLeaveListAPI } from "../../../../constants/api"
import { httpGet } from "../../../../utils/http"

export class LeaveStore {
  @observable public data: any[] = []
  @observable public status: number | string = 0
  @observable public pageSize: number = 20
  @observable public current: number = 1
  @observable public total: number = 0
  @observable public keyword: string = ""
  @observable public end: string = moment().format("X")
  @observable
  public start: string = moment()
    .subtract(29, "days")
    .format("X")

  @action
  public setPage = (current, pageSize) => {
    this.pageSize = pageSize
    this.current = current
    this.getLeaveList({
      page: current,
      pageSize,
      start: this.start,
      end: this.end,
      keyword: this.keyword,
      status: this.status
    })
  }

  @action
  public setTime = (start, end) => {
    this.start = start
    this.end = end
    this.current = 1
    this.getLeaveList({
      page: 1,
      pageSize: this.pageSize,
      start,
      end,
      keyword: this.keyword,
      status: this.status
    })
  }

  @action
  public setKeyWord = keyword => {
    this.keyword = keyword
    this.current = 1
    this.getLeaveList({
      page: 1,
      pageSize: this.pageSize,
      start: this.start,
      end: this.end,
      keyword,
      status: this.status
    })
  }
  @action
  public setStatus = status => {
    this.status = status
    this.current = 1
    this.getLeaveList({
      page: 1,
      pageSize: this.pageSize,
      start: this.start,
      end: this.end,
      keyword: this.keyword,
      status
    })
  }
  @action
  public async getLeaveList(query: object) {
    const res = await httpGet(teacherLeaveListAPI(query))
    if (res) {
      runInAction(() => {
        this.data = res.data.data.list
        this.total = res.data.data.total
      })
    }
  }
}

export default LeaveStore
