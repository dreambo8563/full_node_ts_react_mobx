import { Button } from "antd"
import { observer } from "mobx-react"
import * as React from "react"

// 如果需要用到css
// import * as style from "./style.css"

export interface PreservedLegendsProps {}

export interface PreservedLegendsState {}

// 如果要注入store
// @inject(STORE_TODO, STORE_ROUTER)
@observer
export default class PreservedLegends extends React.Component<
  PreservedLegendsProps,
  PreservedLegendsState
> {
  constructor(props: PreservedLegendsProps, context: any) {
    super(props, context)
    this.state = {}
  }
  public componentWillMount() {
    // 此处可以加载请求
  }
  public componentDidMount() {
    // 此处可以处理带ref的
  }
  public render() {
    return (
      <div>
        <span className="label label-danger">
          <i className="fa fa-exclamation-triangle bg-red b-r-3 f-color"  />
        </span>&nbsp;用户剩余课时不足&nbsp;&nbsp;
        <span className="label label-warning">
          <i className="bg-orange b-r-3 f-color">Demo</i>
        </span>&nbsp;演示课&nbsp;&nbsp;
        <span className="label label-primary">
          <i className="bg-blue-sky b-r-3 f-color">正式课</i>
        </span>&nbsp;已付费用户正式课&nbsp;&nbsp;
        <span className="label">
          <i className="fa fa-tumblr bg-sea-green b-r-3 f-color" />
        </span>&nbsp;临时课&nbsp;&nbsp;
        <span className="label label-success">
          <i className="fa fa-adjust bg-green b-r-3 f-color" />
        </span>&nbsp;请假空闲出来的老师&nbsp;&nbsp;
        <span className="label label-danger">
          <i className="fa fa-ban bg-red b-r-3 f-color" />
        </span>&nbsp;学生请假/提前请假&nbsp;&nbsp;
        <span className="label bg-blue bg-sea-green b-r-3 f-color">
          <i className="fa fa-ban" />
        </span>&nbsp;老师请假&nbsp;&nbsp;
        <span className="label label-danger bg-sea-green b-r-3 f-color">
          <i className="fa fa-user-times" />
        </span>&nbsp;不在工作时间&nbsp;&nbsp;
        <span className="label" style={{ backgroundColor: "#990033" }}>
          <i className="fa fa-thumb-tack bg-sea-green b-r-3 f-color" />
        </span>&nbsp;占位课& nbsp;&nbsp;
        <span className="label label-danger bg-sea-green b-r-3 f-color">
          <i className="fa fa-minus-circle" />
        </span>&nbsp;本周课程被放弃&nbsp;&nbsp;
        <span className="label">
          <i className="fa fa-tags bg-purple b-r-3 f-color" />
        </span>&nbsp;以前是占位课&nbsp;&nbsp;
        <i className="fa fa-user bg-green b-r-3 f-color" />&nbsp;在线&nbsp;&nbsp;
        <i className="fa fa-comment bg-red b-r-3 f-color" />&nbsp;发言&nbsp; &nbsp;
        <i className="fa fa-video-camera bg-orange b-r-3 f-color" />&nbsp;视频&nbsp;&nbsp;
        <i className="fa fa-envira bg-blue-sky b-r-3 f-color" />&nbsp;新用户&nbsp;&nbsp;
      </div>
    )
  }
}
