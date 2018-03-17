import { Button } from "antd"
import { observer } from "mobx-react"
import * as React from "react"
import { RouteComponentProps } from "react-router"

export interface TestProps extends RouteComponentProps<any> {}

export interface TestState {}

// @inject(STORE_TODO, STORE_ROUTER)
@observer
export default class PageFrame extends React.Component<TestProps, TestState> {
  constructor(props: TestProps, context: any) {
    super(props, context)
    this.state = {}
  }

  public render() {
    return <Button type="primary">test</Button>
  }
}
