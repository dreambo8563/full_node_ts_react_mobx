import { Button, Divider, Popover, Table, Tag } from "antd"
import { Pagination } from "antd"
import * as mobx from "mobx"
import { inject, observer } from "mobx-react"
import * as React from "react"
import { STORE_AVAILABLELIST } from "../../../constants/stores"
import { WeekEnum } from "../../../constants/text"
import { AvailableListStore } from "../../../stores"

// 如果需要用到css
// import * as style from "./style.css"

// 已预约可能table

export interface AvailableTableProps {}

export interface AvailableTableState {}

const columns = [
  {
    title: "Time for class",
    key: "name",
    render: (text, record) =>
      `${WeekEnum[record.cn_week]} ${record.cn_start} - ${record.cn_end}`
  },
  {
    title: "TEACHER",
    sorter: true,
    key: "age",
    render: (text, record) => {
      const content = <div>{record.tags}</div>
      return (
        <div>
          <span>
            {record.name}/{record.tid}
          </span>{" "}
          &nbsp;
          {record.tags ? (
            <Popover content={content}>
              <Tag color="magenta">tags</Tag>
            </Popover>
          ) : (
            ""
          )}
        </div>
      )
    }
  },
  {
    title: "INFO",
    key: "address",
    render: (text, record) => {
      return (
        <div>
          {record.tDemo ? (
            <Tag color="gold">demo</Tag>
          ) : (
            <Tag color="blue">正式课</Tag>
          )}
          {record.tDuty ? <Tag color="green">demo值班</Tag> : ""}
          {record.tBilligual ? <Tag color="red">小明星</Tag> : ""}
          {record.basis_tutor ? <Tag color="purple">B</Tag> : ""}
        </div>
      )
    }
  },
  {
    title: "MANGE",
    dataIndex: "address",
    key: "address5",
    render: (text, record) => (
      <span>
        <Button size="small">To add a class</Button>
      </span>
    )
  }
]
@inject(STORE_AVAILABLELIST)
@observer
export default class AvailableTable extends React.Component<
  AvailableTableProps,
  AvailableTableState
> {
  constructor(props: AvailableTableProps, context: any) {
    super(props, context)
  }
  public onShowSizeChange = (current, pageSize) => {
    const store = this.props[STORE_AVAILABLELIST] as AvailableListStore
    const { currentWeek } = store
    store.setPageSize(current, pageSize)
  }
  public handleTableChange = (pagination, filters, sorter) => {}
  public onChange = page => {
    const store = this.props[STORE_AVAILABLELIST] as AvailableListStore
    store.changePage(page)
  }
  public showTotal = total => {
    return `Total ${total} items`
  }
  public render() {
    const store = this.props[STORE_AVAILABLELIST] as AvailableListStore
    const { data, currentPage, total } = store
    const dataSource = mobx.toJS(data)
    return (
      <div>
        <Table
          onChange={this.handleTableChange}
          pagination={false}
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
        />
        <br />
        <Pagination
          showSizeChanger
          onChange={this.onChange}
          onShowSizeChange={this.onShowSizeChange}
          current={currentPage}
          total={total}
          showTotal={this.showTotal}
        />
      </div>
    )
  }
}
