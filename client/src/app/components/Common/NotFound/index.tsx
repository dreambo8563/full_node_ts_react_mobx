import { Button, Row } from "antd"
import { inject, observer } from "mobx-react"
import * as React from "react"
import { RouteComponentProps } from "react-router"

import notfound from "../../../../assets/img/404.jpeg"
import { STORE_ROUTER } from "../../../constants/stores"
import RouterStore from "../../../stores/RouterStore"
import * as style from "./style.css"

export interface TestProps extends RouteComponentProps<any> {}

export interface TestState {}

@inject(STORE_ROUTER)
@observer
export default class Test extends React.Component<TestProps, TestState> {
  constructor(props: TestProps, context: any) {
    super(props, context)
    this.state = {}
  }
  public goHome = () => {
    const router = this.props[STORE_ROUTER] as RouterStore
    router.replace("/")
  }

  public render() {
    return (
      <div>
        <Row type="flex" justify="center">
          <img src={notfound} alt="notfound" />
        </Row>
        <Row type="flex" justify="center">
          <Button onClick={this.goHome} className={style.home_btn} size="large">
            回到首页
          </Button>
        </Row>
      </div>
    )
  }
}
