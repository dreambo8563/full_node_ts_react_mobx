import "echarts/lib/chart/bar"
import "echarts/lib/component/title"
import "echarts/lib/component/tooltip"

import { Button, DatePicker, message, Row } from "antd"
import echarts from "echarts/lib/echarts"
import { inject, observer } from "mobx-react"
import * as moment from "moment"
import * as React from "react"

import { STORE_APP, STORE_DINGGROUP } from "../../../../constants/stores"
import { DingDemoGroupStore } from "../../../../stores"

// 如果需要用到css
// import * as style from "./style.css"

const { RangePicker } = DatePicker
export interface DingDemoGroupProps {}

export interface DingDemoGroupState {}

// 如果要注入store
@inject(STORE_APP, STORE_DINGGROUP)
@observer
export default class DingDemoGroup extends React.Component<
  DingDemoGroupProps,
  DingDemoGroupState
> {
  constructor(props: DingDemoGroupProps, context: any) {
    super(props, context)
    this.state = {}
  }
  public componentWillMount() {
    // 此处可以加载请求
  }
  public componentDidMount() {
    // 此处可以处理带ref的
    const store = this.props[STORE_DINGGROUP] as DingDemoGroupStore
    store.getChartData()
  }
  public onChange = (date, dateString) => {
    const store = this.props[STORE_DINGGROUP] as DingDemoGroupStore
    store.setDuartion(date[0].unix(), date[1].unix())
  }
  public search = () => {
    const store = this.props[STORE_DINGGROUP] as DingDemoGroupStore
    const { startDate, endDate } = store
    if (!startDate || !endDate) {
      message.error("请选择查询时间段")
    } else {
      store.getChartData()
    }
  }
  public render() {
    const store = this.props[STORE_DINGGROUP] as DingDemoGroupStore
    const { data } = store
    const chartEl = document.getElementById("main")
    if (chartEl && echarts) {
      const myChart = echarts.init(chartEl)
      const option = {
        color: ["#3398DB"],
        title: {
          text: "微信约课群人数分布图"
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: "shadow" // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true
        },
        xAxis: [
          {
            type: "category",
            data: data.map(v => v.group),
            axisTick: {
              alignWithLabel: true
            }
          }
        ],
        yAxis: [
          {
            type: "value"
          }
        ],
        series: [
          {
            name: "人数",
            type: "bar",
            barWidth: "60%",
            data: data.map(v => v.total)
          }
        ]
      }

      myChart.setOption(option)
    }

    return (
      <div>
        <Row type="flex" gutter={16}>
          <RangePicker
            allowClear={false}
            locale={"zh_CN"}
            onChange={this.onChange}
            defaultValue={[
              moment.unix(store.startDate),
              moment.unix(store.endDate)
            ]}
          />
          <Button onClick={this.search} type="primary" icon="search">
            查询
          </Button>
        </Row>
        <br />
        <Row>
          <div
            id="main"
            style={{ width: "100%", height: 500, marginBottom: 10 }}
          />
        </Row>
      </div>
    )
  }
}
