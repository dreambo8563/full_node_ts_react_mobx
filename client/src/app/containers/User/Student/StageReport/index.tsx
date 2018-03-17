import "echarts/lib/chart/line"
import "echarts/lib/component/title"
import "echarts/lib/component/tooltip"

import {
  Button,
  Col,
  DatePicker,
  List,
  message,
  Popconfirm,
  Rate,
  Row
} from "antd"
import * as cx from "classnames"
import echarts from "echarts/lib/echarts"
import { inject, observer } from "mobx-react"
import moment, { Moment } from "moment"
import * as React from "react"
import { Component } from "react"
import { RouterProps } from "react-router"

import { STORE_ROUTER, STORE_STAGEREPORT } from "../../../../constants/stores"
import { RouterStore, StageReportStore } from "../../../../stores"
import * as style from "./style.css"

const { MonthPicker } = DatePicker
// const data = [
//   "Racing car sprays burning fuel into crowd.",
//   "Japanese princess to wed commoner.",
//   "Australian walks 100km after outback crash.",
//   "Man charged over missing wedding girl."
// ]
export interface StageReportProps extends RouterProps {}

export interface StageReportState {}
@inject(STORE_STAGEREPORT, STORE_ROUTER)
@observer
class StageReport extends React.Component<StageReportProps, StageReportState> {
  private word = "确认要生成阶段性报告吗？"
  constructor(props: StageReportProps, context: any) {
    super(props, context)
  }

  public componentDidMount() {
    const stageReportStore = this.props[STORE_STAGEREPORT] as StageReportStore
    const router = this.props[STORE_ROUTER] as RouterStore
    const search = router.location.search
    const params = new URLSearchParams(search)
    const name = params.get("name")
    stageReportStore.setName(name || "")

    stageReportStore.getFirstClassTime(name)
    stageReportStore.getLastestCourseReport()
  }

  public setMonth = (m: Moment, type: string) => {
    const stageReportStore = this.props[STORE_STAGEREPORT] as StageReportStore
    stageReportStore.setMonth(m, type)
  }
  public disabledDate = current => {
    const stageReportStore = this.props[STORE_STAGEREPORT] as StageReportStore
    const { firstTime } = stageReportStore
    return (
      moment().endOf("months") < current ||
      current < moment.unix(firstTime).startOf("months")
    )
  }
  public disabledDateMore = current => {
    const stageReportStore = this.props[STORE_STAGEREPORT] as StageReportStore
    const { firstTime } = stageReportStore
    return (
      moment().endOf("months") < current ||
      current < moment.unix(firstTime).startOf("months")
    )
  }
  public createReport = () => {
    const stageReportStore = this.props[STORE_STAGEREPORT] as StageReportStore
    stageReportStore.createReport(() => {
      message.success("报表创建成功")
    })
  }
  public previewReport = () => {
    const stageReportStore = this.props[STORE_STAGEREPORT] as StageReportStore
    const { start, end } = stageReportStore
    if (start && end && start > end) {
      message.warning("开始时间不能大于结束时间")
      return
    }
    if (!start) {
      message.warning("开始时间不能为空")
      return
    }
    if (!end) {
      message.warning("结束时间不能为空")
      return
    }
    stageReportStore.previewReport()
  }
  public isInteger(obj) {
    return obj % 1 === 0
  }
  public render() {
    const stageReportStore = this.props[STORE_STAGEREPORT] as StageReportStore
    const { reportData, hours, remarkList, firstTime, start, end } = stageReportStore
    const chartEl = document.getElementById("main")
    const startMonth: number = start ? start : firstTime
    const endMonth: number = end ? end : moment().unix()
    if (chartEl && reportData) {
      const myChart = echarts.init(chartEl)
      const option = {
        xAxis: {
          type: "category",
          name: "次",
          nameTextStyle: {
            color: "#000"
          },
          data: reportData.avgList.map((v, i) => i).slice(-10),
          axisLabel: {
            formatter(value, index) {
              let str = ""
              str = index + 1
              return str
            },
            fontSize: 18,
            interval: 0,
            textStyle: {
              color: "#000"
            }
          },
          axisLine: {
            lineStyle: {
              color: "#32c487"
            }
          },
          boundaryGap: false
        },
        yAxis: {
          type: "category",
          name: "星",
          nameTextStyle: {
            color: "#000"
          },
          data: [0, 1, 2, 3, 4, 5],
          axisLabel: {
            formatter(value, index) {
              let str = ""
              if (value > 0) {
                for (let i = 0; i < value; i++) {
                  str += "\u2605"
                }
              }
              return str
            },
            fontSize: 18,
            textStyle: {
              color: "#fadb14"
            },
            interval: 0
          },
          axisLine: {
            lineStyle: {
              color: "#32c487"
            }
          },
          boundaryGap: false
        },
        series: [
          {
            data: reportData.avgList.map(v => v.avg),
            type: "line",
            smooth: true,
            symbol: "circle",
            itemStyle: {
              normal: {
                color: "#32c487",
                lineStyle: {
                  color: "#ffe200"
                }
              }
            }
          }
        ],
        color: "red",
        grid: {
          left: 120
        }
      }
      myChart.setOption(option)
    }
    const levelNum = reportData
      ? parseInt(reportData.level , 10)
      : 0
    return (
      <div className={style.reportBox}>
        <Row gutter={8} type="flex" justify="start">
          <Col>
            <Button onClick={this.previewReport} type="primary">
              预览阶段性报告
            </Button>
          </Col>
          <Col>
            <span>开始时间:</span> &nbsp;
            <MonthPicker
              allowClear={false}
              value={startMonth ? moment.unix(startMonth) : moment()}
              className={style.dataWidth}
              onChange={m => this.setMonth(m, "start")}
              disabledDate={this.disabledDate}
              placeholder="开始时间"
            />
          </Col>
          <Col>
            <span>结束时间:</span>&nbsp;
            <MonthPicker
              allowClear={false}
              value={moment.unix(endMonth)}
              onChange={m => this.setMonth(m, "end")}
              disabledDate={this.disabledDateMore}
              placeholder="结束时间"
            />
          </Col>
        </Row>
        {reportData ? (
          <div>
            <div className={style.wordBox}>
              <span>您的孩子在呤呤英语</span>
              <span>
                {moment.unix(reportData.startTime).format("YYYY.MM")} -{" "}
                {moment.unix(reportData.endTime).format("YYYY.MM")}
              </span>
              <span>
                完成了<b>{hours}</b>小时的外教一对一课程
              </span>
              <span>
                度过了<b>{reportData.days + 1}</b>天
              </span>
              <span>
                收到了<b>{reportData.remarksNum}</b>次外教老师给孩子的评价
              </span>
              {(reportData.monthlyList || []).map((v, i) => (
                <span key={i}>
                  <b>{moment.unix(v.start).format("MM")}</b>月完成了<b>
                    {v.count}
                  </b>节课
                </span>
              ))}
            </div>
            <List
              size="small"
              header={<div>各项学习情况分析</div>}
              bordered
              dataSource={remarkList}
              renderItem={item => (
                <List.Item className={style.alignItem}>
                  <Rate
                    allowHalf={true}
                    disabled
                    value={ this.isInteger(item.avgScore) ? item.avgScore : (parseInt(item.avgScore , 10) + 0.5)}
                  />
                  <span className={style.alignItem + " " + style.itemSpace}>
                    {item && item.name}
                  </span>
                  <span className={style.alignItem}>
                    {parseFloat(item.avgScore).toFixed(2)}
                  </span>
                </List.Item>
              )}
            />
            <div className={style.stageBox}>
              <span>学习阶段</span>
              <span className={style.stage}>
                您的当前位置是<b>
                  L
                  {levelNum}
                </b>
              </span>
              <div className={style.learningStageBox}>
                <div className={style.beginner}>
                  <ul>
                    <li
                      className={cx(
                        style.l0,
                        levelNum === 0 ? style.person : ""
                      )}
                    >
                      <i />
                      L0
                    </li>
                  </ul>
                  <div>
                    <h3>入门</h3>
                    <p>Beginner</p>
                  </div>
                </div>
                <div className={style.elementry}>
                  <ul>
                    <li
                      className={cx(
                        style.l1,
                        levelNum === 1 ? style.person : ""
                      )}
                    >
                      <i />L1
                    </li>
                    <li
                      className={cx(
                        style.l2,
                        levelNum === 2 ? style.person : ""
                      )}
                    >
                      <i />L2
                    </li>
                    <li
                      className={cx(
                        style.l3,
                        levelNum === 3 ? style.person : ""
                      )}
                    >
                      <i />L3
                    </li>
                  </ul>
                  <div>
                    <h3>初级</h3>
                    <p>Elementry</p>
                  </div>
                </div>
                <div className={style.intermediate}>
                  <ul>
                    <li
                      className={cx(
                        style.l4,
                        levelNum === 4 ? style.person : ""
                      )}
                    >
                      <i />L4
                    </li>
                    <li
                      className={cx(
                        style.l5,
                        levelNum === 5 ? style.person : ""
                      )}
                    >
                      <i />L5
                    </li>
                    <li
                      className={cx(
                        style.l6,
                        levelNum === 6 ? style.person : ""
                      )}
                    >
                      <i />L6
                    </li>
                    <li
                      className={cx(
                        style.l7,
                        levelNum === 7 ? style.person : ""
                      )}
                    >
                      <i />L7
                    </li>
                  </ul>
                  <div>
                    <h3>中级</h3>
                    <p>Intermediate</p>
                  </div>
                </div>
                <div className={style.advanced}>
                  <ul>
                    <li
                      className={cx(
                        style.l8,
                        levelNum === 8 ? style.person : ""
                      )}
                    >
                      <i />L8
                    </li>
                    <li
                      className={cx(
                        style.l9,
                        levelNum === 9 ? style.person : ""
                      )}
                    >
                      <i />L9
                    </li>
                    <li
                      className={cx(
                        style.l10,
                        levelNum === 10 ? style.person : ""
                      )}
                    >
                      <i />L10
                    </li>
                    <li
                      className={cx(
                        style.l11,
                        levelNum === 11 ? style.person : ""
                      )}
                    >
                      <i />L11
                    </li>
                  </ul>
                  <div>
                    <h3>高级</h3>
                    <p>Advanced</p>
                  </div>
                </div>
                <div className={style.bilingualStar}>
                  <ul>
                    <li
                      className={cx(
                        style.l12,
                        levelNum === 12 ? style.person : ""
                      )}
                    >
                      <i />L12
                    </li>
                    <li
                      className={cx(
                        style.l13,
                        levelNum === 13 ? style.person : ""
                      )}
                    >
                      <i />L13
                    </li>
                    <li
                      className={cx(
                        style.l14,
                        levelNum === 14 ? style.person : ""
                      )}
                    >
                      <i />L14
                    </li>
                    <li
                      className={cx(
                        style.l15,
                        levelNum === 15 ? style.person : ""
                      )}
                    >
                      <i />L15
                    </li>
                  </ul>
                  <div>
                    <h3>双语小明星</h3>
                    <p>Bilingual Star</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <span className={style.noneData}>还没生成过报告</span>
          </div>
        )}
        <div
          className={style.main}
          style={reportData ? { opacity: 1 } : { opacity: 0 }}
        >
          <span>学习综合表现</span>
          <div id="main" style={{ width: "100%", height: 400 }} />
        </div>
        {reportData ? (
          <div>
            <Popconfirm
              placement="top"
              title={this.word}
              onConfirm={this.createReport}
              okText="确定"
              cancelText="放弃"
            >
              <Button>生成报告</Button>
            </Popconfirm>
          </div>
        ) : (
          undefined
        )}
      </div>
    )
  }
}

export default StageReport
