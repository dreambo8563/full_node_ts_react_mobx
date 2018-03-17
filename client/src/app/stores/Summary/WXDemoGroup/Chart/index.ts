import { action, observable, runInAction } from "mobx"

import * as moment from "moment"
import { getDingDemoGroupAPI } from "../../../../constants/api"
import { httpGet } from "../../../../utils/http"
export class DingDemoGroupStore {
  @observable public data: any[] = []
  @observable
  public startDate: number = moment()
    .startOf("month")
    .unix()

  @observable public endDate: number = moment().unix()

  @action
  public setDuartion(start, end) {
    this.startDate = start
    this.endDate = end
  }

  @action
  public async getChartData() {
    const res = await httpGet(
      getDingDemoGroupAPI({
        startDate: this.startDate,
        endDate: this.endDate
      })
    )
    if (res) {
      runInAction(() => {
        this.data = res.data.data
      })
    }
  }
}

export default DingDemoGroupStore
