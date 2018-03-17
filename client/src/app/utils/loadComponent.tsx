import * as React from "react"

export function loadComponent(getComponent) {
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
        return <div>{Component ? <Component /> : undefined}</div>
      }
      return null
    }
  }
}
