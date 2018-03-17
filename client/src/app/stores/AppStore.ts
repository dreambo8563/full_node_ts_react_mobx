import { action, autorun, observable } from "mobx"

export class AppStore {
  // public loadingChange = autorun(() => {
  //   console.log(this.loading)
  // })
  @observable public loading: boolean
  @observable public title: string
  constructor() {
    this.loading = false
    this.title = ""
  }

  @action
  public setLoading = (loading: boolean): void => {
    this.loading = loading
  }
  @action
  public setTitle = (title: string): void => {
    this.title = title
  }
}

export default AppStore
