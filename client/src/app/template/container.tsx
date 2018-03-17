import { Button } from "antd"
import { observer } from "mobx-react"
import * as React from "react"

// 如果需要用到css
// import * as style from "./style.css"

export interface TemplateProps {}

export interface TemplateState {}

// 如果要注入store
// @inject(STORE_TODO, STORE_ROUTER)
@observer
export default class Template extends React.Component<
  TemplateProps,
  TemplateState
> {
  constructor(props: TemplateProps, context: any) {
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
    return <Button type="primary">test</Button>
  }
}
