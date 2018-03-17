import { action, computed, observable, runInAction } from "mobx"
import * as moment from "moment"

import {
  courseSubscribeListAPI,
  teacherAutoCompleteAPI
} from "../../../../constants/api"
import { httpGet } from "../../../../utils/http"

export class SubscribeListStore {
  @observable public data: any[] = []
  @observable public currentPage: number = 1
  @observable public currentTab: string = "1"
  @observable public total: number = 0
  @observable public pageSize: number = 20
  @observable public classType: number = 0

  @observable public teacherList: any[] = []
  @observable public showAdjustModal: boolean = false

  // 下拉各种操作过程中的数据
  @observable
  public selectedCourseInfo: {
    uid: number
    tid: number
    studentName: string
    teacherName: string
    zone: string
    timeline: string
  } = {
    uid: 0,
    tid: 0,
    studentName: "",
    teacherName: "",
    zone: "",
    timeline: ""
  }

  // 当前选中的某条记录
  @observable
  public currentCourseInfo: {
    uid?: number
    tid?: number
    studentName?: string
    teacherName?: string
    zone?: string
    timeline?: string
  } = {
    uid: 0,
    tid: 0,
    studentName: "",
    teacherName: "",
    zone: "",
    timeline: ""
  }
  @observable private week: number
  constructor() {
    this.week = moment().day()
  }

  @computed
  get currentWeek() {
    return this.week === 0 ? "7" : String(this.week)
  }

  @action
  public toggleAdjustModal = () => {
    this.showAdjustModal = !this.showAdjustModal
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
    const res = await httpGet(courseSubscribeListAPI(query))
    if (res) {
      runInAction(() => {
        this.data = res.data.data.list
        this.total = res.data.data.counts
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

  @action
  public handleSearchTeacher = async (value: string) => {
    const res = await httpGet(teacherAutoCompleteAPI({ keywords: value }))
    if (res) {
      runInAction(() => {
        this.teacherList = res.data.data.list
      })
    }
  }

  @action
  public setCurrentCourseInfo = (info: {
    uid: number
    tid: number
    studentName: string
    teacherName: string
    zone: string
    timeline: string
  }) => {
    this.currentCourseInfo = {
      ...info
    }
  }
  private resetList = () => {
    this.data = []
    this.total = 0
  }
}
