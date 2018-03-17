import { Button } from "antd"
import { observer } from "mobx-react"
import * as React from "react"

// 如果需要用到css
// import * as style from "./style.css"

export interface AvailableLegendsProps {}

export interface AvailableLegendsState {}

// 如果要注入store
// @inject(STORE_TODO, STORE_ROUTER)
@observer
export default class AvailableLegends extends React.Component<
  AvailableLegendsProps,
  AvailableLegendsState
> {
  constructor(props: AvailableLegendsProps, context: any) {
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
        <span className="label bg-yellow">
          <i className="fa fa-star bg-yellow b-r-3 f-color" />
        </span>&nbsp;双语小明显&nbsp;&nbsp;
        <span className="label">
          <i className="fa fa-bold bg-green b-r-3 f-color" />
        </span>&nbsp;0基础课老师&nbsp;&nbsp;
      </div>
    )
  }
}
