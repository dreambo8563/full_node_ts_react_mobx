import { Col, Row, Select, Table } from "antd"
import * as mobx from "mobx"
import { inject, observer } from "mobx-react"
import * as moment from "moment"
import * as React from "react"

import { STORE_APP, STORE_MONITORERROR, STORE_ROUTER } from "../../../../constants/stores"
import { AppStore, CourseErrorStore, RouterStore } from "../../../../stores"

const Option = Select.Option

// 如果需要用到css
// import * as style from "./style.css"

export interface ErrorLogProps {}

export interface ErrorLogState {}

// 如果要注入store
@inject(STORE_APP, STORE_MONITORERROR, STORE_ROUTER)
@observer
export default class ErrorLog extends React.Component<
  ErrorLogProps,
  ErrorLogState
> {
  public columns = [
    {
      title: "来源",
      dataIndex: "target",
      key: "target",
      render: (text, record) => {
        if (record.uid === record.student_id) {
          return `学生/${record.student_id}`
        }
        if (record.uid === record.teacher_id) {
          return `老师/${record.teacher_id}`
        }
        return ""
      }
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: text => (text === 1 ? "Error" : "Warn")
    },
    {
      title: "Error Code",
      dataIndex: "error_code",
      key: "error_code"
    },
    {
      title: "Error Msg",
      dataIndex: "error_msg",
      key: "error_msg"
    },
    {
      title: "记录时间",
      dataIndex: "create_time",
      key: "create_time",
      render: text => moment(parseInt(text, 10)).format("HH:mm:ss")
    }
  ]
  constructor(props: ErrorLogProps, context: any) {
    super(props, context)
  }

  public componentDidMount() {
    // 此处可以处理带ref的
    const app = this.props[STORE_APP] as AppStore
    app.setTitle("课堂错误日志")
    const errStore = this.props[STORE_MONITORERROR] as CourseErrorStore
    const router = this.props[STORE_ROUTER] as RouterStore
    const search = router.location.search
    const params = new URLSearchParams(search)
    const uid = params.get("uid")
    const tid = params.get("tid")
    const classTime = params.get("class_time")
    errStore.setQuery(
      parseInt(uid, 10),
      parseInt(tid, 10),
      parseInt(classTime, 10)
    )
    errStore.getLogList({
      uid,
      tid,
      classTime,
      target: 1
    })
  }
  public handleChange = v => {
    const errStore = this.props[STORE_MONITORERROR] as CourseErrorStore
    errStore.changeType(v ? parseInt(v, 10) : v)
  }
  public changeTarget = v => {
    const errStore = this.props[STORE_MONITORERROR] as CourseErrorStore
    errStore.changeTarget(parseInt(v, 10))
  }
  public render() {
    const errStore = this.props[STORE_MONITORERROR] as CourseErrorStore
    const dataSource = mobx.toJS(errStore.data)

    return (
      <div>
        <Row type="flex" justify="start" align="bottom" gutter={16}>
          <Col>
            <span>错误类型: </span> &nbsp;
            <Select
              defaultValue=""
              style={{ width: 120 }}
              onChange={this.handleChange}
            >
              <Option value="">全部</Option>
              <Option value="1">Error</Option>
              <Option value="2">Warning</Option>
            </Select>
          </Col>
          <Col>
            <span>来源: </span>&nbsp;
            <Select
              defaultValue="1"
              style={{ width: 120 }}
              onChange={this.changeTarget}
            >
              <Option value="1">老师</Option>
              <Option value="2">学生</Option>
            </Select>
          </Col>
        </Row>

        <br />
        <br />
        <Table rowKey={"id"} columns={this.columns} dataSource={dataSource} />
      </div>
    )
  }
}
