import { createBrowserHistory } from "history"
import { Provider } from "mobx-react"
import * as React from "react"
import { Redirect, Route, Router, Switch } from "react-router"

import {
  STORE_APP,
  STORE_AVAILABLELIST,
  STORE_DINGGROUP,
  STORE_LEAVE,
  STORE_MONITORERROR,
  STORE_MONITORNETWORK,
  STORE_ROUTER,
  STORE_STAGEREPORT,
  STORE_SUBSCRIBELIST
} from "./constants/stores"
import { Root } from "./layouts/Root"
import {
  AppStore,
  AvailableListStore,
  CourseErrorStore,
  DingDemoGroupStore,
  LeaveStore,
  MonitorNetworkStore,
  RouterStore,
  StageReportStore,
  SubscribeListStore
} from "./stores"
import { loadComponent } from "./utils/loadComponent"
import { loadComponentWithSidebar } from "./utils/loadComponentWithSidebar"

// prepare MobX stores
const history = createBrowserHistory()
const routerStore = new RouterStore(history)
export const appStore = new AppStore()
export const subscribeListStore = new SubscribeListStore()
export const availableListStore = new AvailableListStore()
export const leaveStore = new LeaveStore()
export const stageReportStore = new StageReportStore()
export const monitorNetworkStore = new MonitorNetworkStore()
export const courseErrorStore = new CourseErrorStore()
export const dingDemoGroupStore = new DingDemoGroupStore()
const rootStores = {
  [STORE_ROUTER]: routerStore,
  [STORE_APP]: appStore,
  [STORE_LEAVE]: leaveStore,
  [STORE_SUBSCRIBELIST]: subscribeListStore,
  [STORE_AVAILABLELIST]: availableListStore,
  [STORE_STAGEREPORT]: stageReportStore,
  [STORE_MONITORNETWORK]: monitorNetworkStore,
  [STORE_MONITORERROR]: courseErrorStore,
  [STORE_DINGGROUP]: dingDemoGroupStore
}
export default class App extends React.Component {
  public render() {
    return (
      <Provider {...rootStores}>
        <Root>
          <Router history={history}>
            <Switch>
              <Redirect exact from="/" to="/courses/subscribe/list" />
              <Route
                path="/sales/orders/list"
                component={loadComponentWithSidebar(() =>
                  import("./containers/Sales/Orders/List").then(
                    (module: any) => module.default
                  )
                )}
              />
              <Route
                path="/teacher/leave/list"
                component={loadComponentWithSidebar(() =>
                  import("./containers/Teacher/Leave/List").then(
                    (module: any) => module.default
                  )
                )}
              />
              <Route
                path="/user/student/stagereport"
                component={loadComponentWithSidebar(() =>
                  import("./containers/User/Student/StageReport").then(
                    (module: any) => module.default
                  )
                )}
              />
              <Route
                path="/courses/subscribe/list"
                component={loadComponentWithSidebar(() =>
                  import("./containers/Courses/Subscribe/List").then(
                    (module: any) => module.default
                  )
                )}
              />
              <Route
                path="/courses/monitor/network"
                component={loadComponentWithSidebar(() =>
                  import("./containers/Courses/Monitor/Network").then(
                    (module: any) => module.default
                  )
                )}
              />
              <Route
                path="/courses/monitor/errlog"
                component={loadComponentWithSidebar(() =>
                  import("./containers/Courses/Monitor/ErrorLog").then(
                    (module: any) => module.default
                  )
                )}
              />
              <Route
                path="/summary/wxdemogroup/chart"
                component={loadComponentWithSidebar(() =>
                  import("./containers/Summary/WXDemoGroup/Chart").then(
                    (module: any) => module.default
                  )
                )}
              />
              <Route
                component={loadComponent(() =>
                  import("./components/Common/NotFound").then(
                    (module: any) => module.default
                  )
                )}
              />
            </Switch>
          </Router>
        </Root>
      </Provider>
    )
  }
}
