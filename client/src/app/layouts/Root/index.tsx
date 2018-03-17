import * as React from "react"

export class Root extends React.Component<any, any> {
  public renderDevTool() {
    if (process.env.NODE_ENV !== "production") {
      const DevTools = require("mobx-react-devtools").default
      return <DevTools />
    }
  }

  public render() {
    return (
      <div style={{ height: "100%" }}>
        {this.props.children}
        {this.renderDevTool()}
      </div>
    )
  }
}
