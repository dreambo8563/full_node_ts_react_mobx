import * as React from "react"
import { SidebarLayout } from "../layouts/SidebarLayout"

export function loadComponentWithSidebar(getComponent) {
  return class AsyncComponent extends React.Component {
    public static Component = null
    public state = { Component: AsyncComponent.Component }

    public componentWillMount() {
      if (!this.state.Component) {
        getComponent().then(Component => {
          AsyncComponent.Component = Component
          this.setState({ Component })
        })
      }
    }
    public render() {
      const { Component } = this.state
      if (Component) {
        return (
          <SidebarLayout>{Component ? <Component /> : undefined}</SidebarLayout>
        )
      }
      return null
    }
  }
}
