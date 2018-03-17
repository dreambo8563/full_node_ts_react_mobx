import "antd/dist/antd.less"
import "../assets/less/font-awesome.less"
import "../assets/main.css"

import { LocaleProvider } from "antd"
import zh_CN from "antd/lib/locale-provider/zh_CN"
import { useStrict } from "mobx"
import * as React from "react"
import * as ReactDOM from "react-dom"

import App from "./routers"

// enable MobX strict mode
useStrict(true)

// render react DOM
ReactDOM.render(
  <LocaleProvider locale={zh_CN}>
    <App />
  </LocaleProvider>,
  document.getElementById("app")
)
