import { Tabs } from "antd"
import { Select } from "antd"
import * as mobx from "mobx"
import { inject, observer } from "mobx-react"
import * as moment from "moment"
import * as React from "react"

import AvailableLegends from "../../../../components/Courses/AvailableLegends"
import AvailableTable from "../../../../components/Courses/AvailableTable"
import PreservedLegends from "../../../../components/Courses/PreservedLegends"
import PreservedTable from "../../../../components/Courses/PreservedTable"
import {
  STORE_APP,
  STORE_AVAILABLELIST,
  STORE_SUBSCRIBELIST
} from "../../../../constants/stores"

import {
  AppStore,
  AvailableListStore,
  SubscribeListStore
} from "../../../../stores"
import { httpGet } from "../../../../utils/http"

const Option = Select.Option
const TabPane = Tabs.TabPane
// 如果需要用到css
// import * as style from "./style.css"

export interface SubscribeListProps {}

export interface SubscribeListState {
  currentTab: "1" | "2"
  classType: string
}

// 如果要注入store
@inject(STORE_APP, STORE_SUBSCRIBELIST, STORE_AVAILABLELIST)
@observer
export default class SubscribeList extends React.Component<
  SubscribeListProps,
  SubscribeListState
> {
  constructor(props: SubscribeListProps, context: any) {
    super(props, context)
    this.state = {
      currentTab: "1",
      classType: "0"
    }
  }
  public componentWillMount() {
    // 此处可以加载请求
    const app = this.props[STORE_APP] as AppStore
    app.setTitle("Class Management")
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    const { pageSize, currentWeek } = store
    store.setList({
      page: 1,
      currentWeek,
      pageSize
    })
  }

  public sortChange = sorter => {
    console.log(sorter)
  }

  public handleChange = value => {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    const { currentTab } = store
    if (currentTab === "1") {
      store.setClassType(parseInt(value, 10))
    }
    if (currentTab === "2") {
      const availabelStore = this.props[
        STORE_AVAILABLELIST
      ] as AvailableListStore
      availabelStore.setClassType(parseInt(value, 10))
    }
  }

  public tabChange = key => {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    store.setCurrentTab(key)
    if (Number(key) === 1) {
      const { currentWeek, pageSize } = store
      store.setList({
        page: 1,
        currentWeek,
        pageSize,
        type: 0
      })
    }
    if (Number(key) === 2) {
      const availabelStore = this.props[
        STORE_AVAILABLELIST
      ] as AvailableListStore
      const { currentWeek, pageSize } = availabelStore
      availabelStore.setList({
        page: 1,
        currentWeek,
        pageSize,
        type: 0
      })
    }
  }
  public weekChange = key => {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    const { currentTab } = store
    if (currentTab === "1") {
      store.setCurrentWeek(key)
    }
    if (currentTab === "2") {
      const availabelStore = this.props[
        STORE_AVAILABLELIST
      ] as AvailableListStore
      availabelStore.setCurrentWeek(key)
    }
  }
  public componentDidMount() {
    // 此处可以处理带ref的
  }
  public render() {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    const availabelStore = this.props[STORE_AVAILABLELIST] as AvailableListStore
    const { currentTab } = store
    const week =
      currentTab === "1" ? store.currentWeek : availabelStore.currentWeek
    const operations =
      currentTab === "1" ? (
        <div>
          <Select
            defaultValue="0"
            style={{ width: 150 }}
            onChange={this.handleChange}
          >
            <Option value="0">All</Option>
            <Option value="1">正式课</Option>
            <Option value="2">demo</Option>
            <Option value="3">学生请假/提前请假</Option>
            <Option value="4">老师请假</Option>
          </Select>
        </div>
      ) : (
        <div>
          {" "}
          <Select
            defaultValue="0"
            style={{ width: 150 }}
            onChange={this.handleChange}
          >
            <Option value="0">All</Option>
            <Option value="1">正式课</Option>
            <Option value="2">demo</Option>
            <Option value="3">demo值班</Option>
          </Select>
        </div>
      )
    const legends = currentTab === "1" ? <div /> : <div />
    return (
      <Tabs activeKey={currentTab} onChange={this.tabChange}>
        <TabPane tab="已约课程" key="1">
          {currentTab === "1" ? (
            <div>
              <br />
              <PreservedLegends />
              <br />
              <Tabs
                animated={false}
                type="card"
                onChange={this.weekChange}
                activeKey={week}
                tabBarExtraContent={operations}
              >
                <TabPane tab="All" key="0">
                  <PreservedTable />
                </TabPane>
                <TabPane tab="Mon" key="1">
                  <PreservedTable />
                </TabPane>
                <TabPane tab="Tue" key="2">
                  <PreservedTable />
                </TabPane>
                <TabPane tab="Wed" key="3">
                  <PreservedTable />
                </TabPane>
                <TabPane tab="Thur" key="4">
                  <PreservedTable />
                </TabPane>
                <TabPane tab="Fri" key="5">
                  <PreservedTable />
                </TabPane>
                <TabPane tab="Sat" key="6">
                  <PreservedTable />
                </TabPane>
                <TabPane tab="Sun" key="7">
                  <PreservedTable />
                </TabPane>
              </Tabs>
            </div>
          ) : (
            undefined
          )}
        </TabPane>
        <TabPane tab="可约时间" key="2">
          {currentTab === "2" ? (
            <div>
              <br />
              <AvailableLegends />
              <br />
              <Tabs
                animated={false}
                onChange={this.weekChange}
                activeKey={week}
                tabBarExtraContent={operations}
              >
                <TabPane tab="All" key="0">
                  <AvailableTable />
                </TabPane>
                <TabPane tab="Mon" key="1">
                  <AvailableTable />
                </TabPane>
                <TabPane tab="Tue" key="2">
                  <AvailableTable />
                </TabPane>
                <TabPane tab="Wed" key="3">
                  <AvailableTable />
                </TabPane>
                <TabPane tab="Thur" key="4">
                  <AvailableTable />
                </TabPane>
                <TabPane tab="Fri" key="5">
                  <AvailableTable />
                </TabPane>
                <TabPane tab="Sat" key="6">
                  <AvailableTable />
                </TabPane>
                <TabPane tab="Sun" key="7">
                  <AvailableTable />
                </TabPane>
              </Tabs>
            </div>
          ) : (
            undefined
          )}
        </TabPane>
      </Tabs>
    )
  }
}
