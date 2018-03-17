import {
  AutoComplete,
  Button,
  Divider,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Table
} from "antd"
import * as mobx from "mobx"
import { inject, observer } from "mobx-react"
import moment from "moment"
import * as React from "react"

import {
  delCourseAPI,
  giveupDemoAPI,
  giveupOfficialAPI,
  takeLeaveOnCourseAPI,
  takeLeaveOnCourserForTeacherAPI,
  teacherAutoCompleteAPI,
  tempAdjustCourseAPI
} from "../../../constants/api"
import { STORE_SUBSCRIBELIST } from "../../../constants/stores"
import { timeLineArr, WeekEnum, zoneArray } from "../../../constants/text"
import { SubscribeListStore } from "../../../stores"
import { httpDel, httpGet, httpPost, httpPut } from "../../../utils/http"

// 如果需要用到css
import * as style from "./style.css"

const Option = Select.Option
// 已预约课程table
export interface PreservedTableProps {}

export interface PreservedTableState {
  showAdjustModal: boolean
}

// 如果要注入store
// @inject(STORE_TODO, STORE_ROUTER)
@inject(STORE_SUBSCRIBELIST)
@observer
export default class PreservedTable extends React.Component<
  PreservedTableProps,
  PreservedTableState
> {
  public columns = [
    {
      title: "WEEK",
      key: "week",
      render: (text, record) => WeekEnum[record.week]
    },
    {
      title: "Time for class",
      sorter: true,
      key: "start",
      render: (text, record) => `${record.start} - ${record.end}`
    },
    {
      title: "STUDENT",
      key: "stuName",
      render: (text, record) => (
        <div>
          <i className="fa fa-envira bg-blue-sky b-r-3 f-color" />&nbsp;
          {/* {record.isNew} */}
          {record.stuName}/{record.uid}{" "}
          <span className="">
            {record.used_course}/{record.classCount}
          </span>
        </div>
      )
    },
    {
      title: "TEACHER",
      key: "teacher",
      render: (text, record) => (
        <div>
          {record.teacheName}/{record.tid}
        </div>
      )
    },
    {
      title: "COURSE INFO",
      key: "course",
      render: (text, record) => (
        <div>
          {record.isDemo ? "demo" : "正式课"}
          <span>{record.adminUser}</span>
          {/* - 已约:xxx */}
        </div>
      )
    },
    {
      title: "BOOKING TIME",
      sorter: true,
      key: "time",
      render: (text, record) => (
        <div>
          {record.bookTime
            ? moment.unix(record.bookTime).format("MM-DD HH:mm")
            : ""}
        </div>
      )
    },
    {
      title: "MANGE",
      dataIndex: "address",
      key: "address5",
      render: (text, record) => (
        <span className={style.manageBtnBd}>
          {record.isDemo ? (
            <>
              <Button onClick={() => this.giveupDemo(record.sid)} size="small">
                放弃Demo
              </Button>
              <Divider type="vertical" />
            </>
          ) : (
            <>
              <Button
                onClick={() => this.giveupOfficial(record.sid)}
                size="small"
              >
                放弃24H内正式课
              </Button>
              <Divider type="vertical" />
            </>
          )}

          <Button
            onClick={() => this.takeLeaveOnCourse(record.sid)}
            size="small"
          >
            提前请假
          </Button>
          <Button
            onClick={() => this.takeLeaveOnCourseForTeacher(record.sid)}
            size="small"
          >
            老师请假
          </Button>
          <Divider type="vertical" />
          {!record.isDemo && !record.isPlaceholder ? (
            <>
              <Button
                onClick={() => this.tempAdjustCourse(record)}
                size="small"
              >
                更改-临时性调课
              </Button>
              <Divider type="vertical" />
            </>
          ) : (
            undefined
          )}

          <Popconfirm
            title="Are you sure delete this task?"
            onConfirm={() => this.delCourse(record.sid)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small">Del</Button>
          </Popconfirm>
        </span>
      )
    }
  ]

  constructor(props: PreservedTableProps, context: any) {
    super(props, context)
    this.state = {
      showAdjustModal: false
    }
  }

  public tempAdjustCourse(record: any) {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    store.toggleAdjustModal()
    const {
      tid,
      week,
      start,
      isDemo,
      uid,
      courseid,
      stuName,
      teacheName,
      end
    } = record
    store.setCurrentCourseInfo({
      uid,
      tid,
      studentName: stuName,
      teacherName: teacheName,
      zone: "Asia/Shanghai",
      timeline: `${start}-${end}`
    })

    const data = {
      tid,
      week,
      start,
      uid,
      courseid
    }
    console.log(record)
    // httpPut(tempAdjustCourseAPI(record.sid), data).then(res => {
    //   if (res) {
    //     message.success("代课成功")
    //   }
    // })
  }
  public giveupDemo(sid: number) {
    httpPost(giveupDemoAPI(sid)).then(res => {
      if (res) {
        message.success("demo 课放弃成功")
      }
    })
  }

  public giveupOfficial(sid: number) {
    httpPost(giveupOfficialAPI(sid)).then(res => {
      if (res) {
        message.success("24小时内正式课放弃成功")
      }
    })
  }

  public takeLeaveOnCourseForTeacher(sid: number) {
    httpPost(takeLeaveOnCourserForTeacherAPI(sid)).then(res => {
      if (res) {
        message.success("老师请假成功")
      }
    })
  }

  public takeLeaveOnCourse(sid: number) {
    httpPost(takeLeaveOnCourseAPI(sid)).then(res => {
      if (res) {
        message.success("学生请假成功")
      }
    })
  }
  /**
   * 每页数量变化触发
   *
   * @memberof PreservedTable
   */
  public onShowSizeChange = (current, pageSize) => {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    const { currentWeek } = store
    store.setPageSize(current, pageSize)
  }
  /**
   * sort 触发
   *
   * @memberof PreservedTable
   */
  public handleTableChange = (pagination, filters, sorter) => {
    // console.log(sorter)
    // const { onSortChange } = this.props
    // onSortChange(sorter)
  }
  /**
   * 翻页触发
   *
   * @memberof PreservedTable
   */
  public onChange = page => {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    store.changePage(page)
  }
  public delCourse(sid: number): any {
    httpDel(delCourseAPI(sid)).then(res => {
      if (res) {
        console.log(res)
      }
    })
  }
  public componentWillMount() {
    // 此处可以加载请求
  }
  public componentDidMount() {
    // 此处可以处理带ref的
  }
  public showTotal = total => {
    return `Total ${total} items`
  }
  public handleOk = type => {
    console.log(`modal ${type}`)
  }
  public handleCancel = type => {
    console.log(`close modal ${type}`)
  }
  public changeZone = v => {
    console.log(v)
  }
  public handleSearchTeacher = v => {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    store.handleSearchTeacher(v)
  }
  public onSelectTeacher = v => {
    console.log(v)
  }
  public render() {
    const store = this.props[STORE_SUBSCRIBELIST] as SubscribeListStore
    const {
      data,
      currentPage,
      total,
      pageSize,
      teacherList,
      showAdjustModal,
      currentCourseInfo
    } = store
    const dataSource = mobx.toJS(data)
    const teacherSearchResult = teacherList.map(v => {
      return {
        value: v.id,
        text: v.name
      }
    })
    console.log(currentCourseInfo)
    return (
      <div>
        <Table
          className={style.preservedTable}
          rowKey="sid"
          onChange={this.handleTableChange}
          pagination={false}
          dataSource={dataSource}
          columns={this.columns}
        />
        <br />
        <Pagination
          defaultPageSize={pageSize}
          showSizeChanger
          onChange={this.onChange}
          onShowSizeChange={this.onShowSizeChange}
          current={currentPage}
          total={total}
          showTotal={this.showTotal}
        />
        <Modal
          width="800px"
          title="Adjust Course"
          visible={showAdjustModal}
          onOk={() => this.handleOk("adjust")}
          onCancel={() => this.handleCancel("adjust")}
        >
          <Select
            defaultValue="Asia/Shanghai"
            style={{ width: 200 }}
            onChange={this.changeZone}
          >
            {zoneArray.map((v, i) => (
              <Option key={i} value={v}>
                {v}
              </Option>
            ))}
          </Select>
          <Select defaultValue="1" style={{ width: 150 }}>
            {Object.keys(WeekEnum).map((k, i) => (
              <Option key={i} value={k}>
                {WeekEnum[k]}
              </Option>
            ))}
          </Select>
          <Select
            defaultValue="Asia/Shanghai"
            style={{ width: 200 }}
            onChange={this.changeZone}
          >
            {timeLineArr.map((v, i) => (
              <Option key={i} value={v}>
                {v}
              </Option>
            ))}
          </Select>
          <AutoComplete
            dataSource={teacherSearchResult}
            style={{ width: 200 }}
            onSelect={this.onSelectTeacher}
            onSearch={this.handleSearchTeacher}
            placeholder="input here"
          />
        </Modal>
      </div>
    )
  }
}
