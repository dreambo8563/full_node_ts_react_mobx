import "echarts/lib/chart/line"
import "echarts/lib/chart/pie"
import "echarts/lib/component/dataZoom"
import "echarts/lib/component/legend"
import "echarts/lib/component/title"
import "echarts/lib/component/tooltip"
import echarts from "echarts/lib/echarts"

import { Col, Row } from "antd"
import * as mobx from "mobx"
import { inject, observer } from "mobx-react"
import moment from "moment"
import * as React from "react"
import { Component } from "react"
import { RouterProps } from "react-router"
import {
  STORE_APP,
  STORE_MONITORNETWORK,
  STORE_ROUTER
} from "../../../../constants/stores"
import { AppStore, MonitorNetworkStore, RouterStore } from "../../../../stores"
import * as style from "./style.css"

export interface MonitorNetworkProps extends RouterProps {}

export interface MonitorNetworkState {}
@inject(STORE_MONITORNETWORK, STORE_ROUTER, STORE_APP)
@observer
class MonitorNetwork extends React.Component<
  MonitorNetworkProps,
  MonitorNetworkState
> {
  constructor(props: MonitorNetworkProps, context: any) {
    super(props, context)
  }
  public componentDidMount() {
    const monitorNetworkStore = this.props[
      STORE_MONITORNETWORK
    ] as MonitorNetworkStore
    const app = this.props[STORE_APP] as AppStore
    app.setTitle("课堂网络质量报告")
    const router = this.props[STORE_ROUTER] as RouterStore
    const search = router.location.search
    const params = new URLSearchParams(search)
    const uid = params.get("uid")
    const tid = params.get("tid")
    const classTime = params.get("class_time")
    monitorNetworkStore.setParams(
      parseInt(uid, 10),
      parseInt(tid, 10),
      parseInt(classTime, 10)
    )
  }
  public render() {
    const monitorNetworkStore = this.props[
      STORE_MONITORNETWORK
    ] as MonitorNetworkStore
    const {
      studentData,
      teacherData,
      studentTxPie,
      studentRxPie,
      teacherTxPie,
      teacherRxPie,
      uid,
      tid,
      classTime
    } = monitorNetworkStore
    const colors = ["#5793f3", "#d14a61", "#675bba"]
    const chartEl = document.getElementById("main")
    const chartEl1 = document.getElementById("main1")
    if (chartEl && studentData) {
      const myChart = echarts.init(chartEl)

      const option = {
        color: colors,
        title: {
          text: "学生网络数据-数值越大越好"
        },
        tooltip: {
          trigger: "axis"
        },
        legend: {
          data: ["上行网络", "下行网络"]
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: studentData.map((v, i) =>
            moment(v.create_time).format("HH:mm:ss")
          ),
          axisLabel: {
            interval: 0
          }
        },
        yAxis: {
          type: "value"
        },
        dataZoom: [
          {
            startValue:
              studentData.slice(-20)[0] && studentData.slice(-20)[0].create_time
                ? moment(studentData.slice(-20)[0].create_time).format(
                    "HH:mm:ss"
                  )
                : undefined
          },
          {
            type: "inside"
          }
        ],
        series: [
          {
            name: "上行网络",
            type: "line",
            stack: "tx_quality",
            data: studentData.map((v, i) => v.tx_quality)
          },
          {
            name: "下行网络",
            type: "line",
            stack: "rx_quality",
            data: studentData.map((v, i) => v.rx_quality)
          }
        ]
      }
      myChart.setOption(option)
    }

    if (chartEl1 && teacherData) {
      const myChart = echarts.init(chartEl1)
      const option = {
        color: colors,
        title: {
          text: "老师网络数据"
        },
        tooltip: {
          trigger: "axis"
        },
        legend: {
          data: ["上行网络", "下行网络"]
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: teacherData.map((v, i) =>
            moment.unix(v.create_time).format("h:mm:ss")
          )
        },
        yAxis: {
          type: "value"
        },
        dataZoom: [
          {
            startValue:
              teacherData.slice(-20)[0] && teacherData.slice(-20)[0].create_time
                ? moment(teacherData.slice(-20)[0].create_time).format(
                    "HH:mm:ss"
                  )
                : undefined
          },
          {
            type: "inside"
          }
        ],
        series: [
          {
            name: "上行网络",
            type: "line",
            stack: "tx_quality",
            data: teacherData.map((v, i) => v.tx_quality)
          },
          {
            name: "下行网络",
            type: "line",
            stack: "rx_quality",
            data: teacherData.map((v, i) => v.rx_quality)
          }
        ]
      }
      myChart.setOption(option)
    }
    const sTxEl = document.getElementById("student_tx_quality")
    if (sTxEl && studentTxPie) {
      const myChart = echarts.init(sTxEl)
      const option = {
        title: {
          text: "学生上行网络质量"
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        series: [
          {
            name: "上行网络",
            type: "pie",
            radius: "55%",
            center: ["50%", "60%"],
            data: mobx.toJS(studentTxPie).map(v => {
              switch (v.name) {
                case "好":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#4272c7"
                    }
                  }

                case "一般":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#5a9bd5"
                    }
                  }

                case "较差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#fabd00"
                    }
                  }

                case "很差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#ee6348"
                    }
                  }
                case "未知异常":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }

                default:
                  return {
                    ...v,
                    name: "未知异常",
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }
              }
            }),
            itemStyle: {
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)"
              }
            }
          }
        ]
      }
      myChart.setOption(option)
    }
    const sRxEl = document.getElementById("student_rx_quality")
    if (sRxEl && studentRxPie) {
      const myChart = echarts.init(sRxEl)
      const option = {
        title: {
          text: "学生下行网络质量"
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        series: [
          {
            name: "下行网络",
            type: "pie",
            radius: "55%",
            center: ["50%", "60%"],
            data: mobx.toJS(studentRxPie).map(v => {
              switch (v.name) {
                case "好":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#4272c7"
                    }
                  }

                case "一般":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#5a9bd5"
                    }
                  }

                case "较差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#fabd00"
                    }
                  }

                case "很差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#ee6348"
                    }
                  }
                case "未知异常":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }

                default:
                  return {
                    ...v,
                    name: "未知异常",
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }
              }
            }),
            itemStyle: {
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)"
              }
            }
          }
        ]
      }
      myChart.setOption(option)
    }

    const tRxEl = document.getElementById("teacher_rx_quality")
    if (tRxEl && teacherRxPie) {
      const myChart = echarts.init(tRxEl)
      const option = {
        title: {
          text: "老师上行网络质量"
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        series: [
          {
            name: "上行网络",
            type: "pie",
            radius: "55%",
            center: ["50%", "60%"],
            data: mobx.toJS(teacherRxPie).map(v => {
              switch (v.name) {
                case "好":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#4272c7"
                    }
                  }

                case "一般":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#5a9bd5"
                    }
                  }

                case "较差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#fabd00"
                    }
                  }

                case "很差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#ee6348"
                    }
                  }
                case "未知异常":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }

                default:
                  return {
                    ...v,
                    name: "未知异常",
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }
              }
            }),
            itemStyle: {
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)"
              }
            }
          }
        ]
      }
      myChart.setOption(option)
    }

    const tTxEl = document.getElementById("teacher_tx_quality")
    if (tTxEl && teacherTxPie) {
      const myChart = echarts.init(tTxEl)
      const option = {
        title: {
          text: "老师下行网络质量"
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        series: [
          {
            name: "下行网络",
            type: "pie",
            radius: "55%",
            center: ["50%", "60%"],
            data: mobx.toJS(teacherTxPie).map(v => {
              switch (v.name) {
                case "好":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#4272c7"
                    }
                  }

                case "一般":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#5a9bd5"
                    }
                  }

                case "较差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#fabd00"
                    }
                  }

                case "很差":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#ee6348"
                    }
                  }
                case "未知异常":
                  return {
                    ...v,
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }

                default:
                  return {
                    ...v,
                    name: "未知异常",
                    itemStyle: {
                      color: "#c1c1c1"
                    }
                  }
              }
            }),
            itemStyle: {
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)"
              }
            }
          }
        ]
      }
      myChart.setOption(option)
    }
    return (
      <div>
        <div>
          学生id-{uid}/老师id-{tid}/开课时间-{moment
            .unix(classTime)
            .format("YYYY-MM-DD HH:mm:ss")}
        </div>
        <br />
        <Row>
          <div
            id="main"
            style={{ width: "100%", height: 360, marginBottom: 10 }}
          />
        </Row>
        <br />
        <Row type="flex">
          <Col span={12}>
            <div
              id="student_tx_quality"
              style={{ width: "100%", height: 360, marginBottom: 40 }}
            />
          </Col>
          <Col span={12}>
            <div
              id="student_rx_quality"
              style={{ width: "100%", height: 360, marginBottom: 40 }}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <div
            id="main1"
            style={{ width: "100%", height: 360, marginBottom: 40 }}
          />
        </Row>
        <br />
        <Row type="flex">
          <Col span={12}>
            <div
              id="teacher_tx_quality"
              style={{ width: "100%", height: 360, marginBottom: 40 }}
            />
          </Col>
          <Col span={12}>
            <div
              id="teacher_rx_quality"
              style={{ width: "100%", height: 360, marginBottom: 40 }}
            />
          </Col>
        </Row>
      </div>
    )
  }
}

export default MonitorNetwork
