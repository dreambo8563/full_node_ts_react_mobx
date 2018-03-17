import { DatePicker, Input, Pagination, Select, Table } from "antd"
import { FormComponentProps } from "antd/lib/form/Form"
import * as mobx from "mobx"
import { inject, observer } from "mobx-react"
import moment from "moment"
import * as React from "react"
import { RouterProps } from "react-router"

import { STORE_APP, STORE_LEAVE } from "../../../../constants/stores"
import { LeaveStatusEnum } from "../../../../constants/text"
import { AppStore, LeaveStore } from "../../../../stores"
import * as style from "./style.css"

const dateFormat = "YYYY-MM-DD"
const Option = Select.Option
const { RangePicker } = DatePicker
const { Column, ColumnGroup } = Table

const columns = [
  {
    title: "教师",
    dataIndex: "tid",
    key: "tid",
    render: (text, data) => {
      return {
        children: (
          <span>
            {data.tid} / {data.name}
          </span>
        )
      }
    }
  },
  {
    title: "开始时间",
    dataIndex: "start",
    key: "start"
  },
  {
    title: "结束时间",
    dataIndex: "end",
    key: "end"
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "id",
    render: (text, data) => LeaveStatusEnum[data.status]
  }
]
export interface LeaveProps extends FormComponentProps, RouterProps {}

export interface LeaveState {}
@inject(STORE_APP, STORE_LEAVE)
@observer
class Leave extends React.Component<LeaveProps, LeaveState> {
  constructor(props: LeaveProps, context: any) {
    super(props, context)
  }
  public componentWillMount() {
    const app = this.props[STORE_APP] as AppStore
    const leaveStore = this.props[STORE_LEAVE] as LeaveStore
    app.setTitle("老师请假列表")
    leaveStore.getLeaveList({
      page: leaveStore.current,
      pageSize: leaveStore.pageSize,
      start: leaveStore.start,
      end: leaveStore.end,
      keyword: leaveStore.keyword,
      status: leaveStore.status
    })
  }

  public onInputChange = event => {
    const leaveStore = this.props[STORE_LEAVE] as LeaveStore
    leaveStore.setKeyWord(event.target.value)
  }
  public onChange = (key, pageSize) => {
    const leaveStore = this.props[STORE_LEAVE] as LeaveStore
    leaveStore.setPage(key, pageSize)
  }
  public onSelectChange = value => {
    const leaveStore = this.props[STORE_LEAVE] as LeaveStore
    leaveStore.setStatus(value)
  }
  public onOk = value => {
    const leaveStore = this.props[STORE_LEAVE] as LeaveStore
    const [start, end] = value
    leaveStore.setTime(start.format("X"), end.format("X"))
  }
  public onShowSizeChange = (key, pageSize) => {
    const leaveStore = this.props[STORE_LEAVE] as LeaveStore
    leaveStore.setPage(key, pageSize)
  }
  public render() {
    // let current = this.state.current
    const leaveStore = this.props[STORE_LEAVE] as LeaveStore
    const list = mobx.toJS(leaveStore.data)
    const total = leaveStore.total
    const pageSize = leaveStore.pageSize
    const current = leaveStore.current
    return (
      <div>
        <div className={style.clearfix}>
          <RangePicker
            className={style.left}
            defaultValue={[moment().subtract(29, "days"), moment()]}
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            placeholder={["Start Time", "End Time"]}
            onOk={this.onOk}
          />
          <Select
            className={style.leaveSelect}
            defaultValue="0"
            onChange={this.onSelectChange}
          >
            <Option value="">All</Option>
            {Object.keys(LeaveStatusEnum).map(k => (
              <Option key={k} value={k}>
                {LeaveStatusEnum[k]}
              </Option>
            ))}
          </Select>
          <div className={style.right}>
            <Input
              onChange={this.onInputChange}
              // onPressEnter={this.enter}
              placeholder="在表格中搜索"
            />
          </div>
        </div>
        <br />
        <Table
          rowKey="id"
          className={style.leveTable}
          dataSource={list}
          pagination={false}
          columns={columns}
        />
        <Pagination
          className={style.pagination}
          showSizeChanger
          defaultPageSize={pageSize}
          onChange={this.onChange}
          onShowSizeChange={this.onShowSizeChange}
          defaultCurrent={1}
          total={total}
          current={current}
        />
      </div>
    )
  }
}

export default Leave
