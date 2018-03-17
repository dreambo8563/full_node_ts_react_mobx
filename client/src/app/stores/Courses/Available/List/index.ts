import { action, computed, observable, runInAction } from "mobx"
import * as moment from "moment"

import { availableTimeListAPI } from "../../../../constants/api"
import { httpGet } from "../../../../utils/http"

export class AvailableListStore {
  @observable public data: any[] = []
  @observable public currentPage: number = 1
  @observable public currentTab: string = "1"
  @observable public total: number = 0
  @observable public pageSize: number = 20
  @observable public classType: number = 0
  @observable private week: number
  constructor() {
    this.week = moment().day()
  }

  @computed
  get currentWeek() {
    return this.week === 0 ? "7" : String(this.week)
  }

  @action
  public setCurrentWeek = (week: number): void => {
    this.week = week
    this.currentPage = 1
    this.resetList()
    this.setList({
      page: 1,
      currentWeek: week,
      pageSize: this.pageSize,
      type: this.classType
    })
  }

  @action
  public setList = async (query: object) => {
    const res = await httpGet(availableTimeListAPI(query))
    if (res) {
      runInAction(() => {
        this.data = res.data.data.list
        this.total = res.data.data.total
      })
    }
  }
  @action
  public changePage = (page: number): void => {
    this.currentPage = page
    this.resetList()
    this.setList({
      page,
      currentWeek: this.currentWeek,
      pageSize: this.pageSize,
      type: this.classType
    })
  }
  @action
  public setCurrentTab = (tab: string): void => {
    this.currentTab = tab
    this.resetList()
  }
  @action
  public setPageSize = (page: number, sizer: number): void => {
    this.currentPage = page
    this.pageSize = sizer
    this.setList({
      page,
      currentWeek: this.currentWeek,
      pageSize: sizer,
      type: this.classType
    })
  }

  @action
  public setClassType = (type: number) => {
    this.classType = type
    this.setList({
      page: this.currentPage,
      currentWeek: this.currentWeek,
      pageSize: this.pageSize,
      type
    })
  }
  private resetList = () => {
    this.data = []
    this.total = 0
    this.classType = 0
  }
}
