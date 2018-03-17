import { Button, Col, Form, Icon, Input, Row } from "antd"
import { Divider, Table } from "antd"
import { FormComponentProps } from "antd/lib/form/Form"
import { inject, observer } from "mobx-react"
import * as React from "react"
import { RouterProps } from "react-router"

import { STORE_APP } from "../../../../constants/stores"
import { AppStore } from "../../../../stores"
import { httpAll, httpGet } from "../../../../utils/http"
import * as style from "./style.css"

const FormItem = Form.Item

export interface TestProps extends FormComponentProps, RouterProps {}

export interface TestState {
  data: Array<{
    key: string
    name: string
    age: number
    address: string
  }>
}

@inject(STORE_APP)
@observer
class Test extends React.Component<TestProps, TestState> {
  constructor(props: TestProps, context: any) {
    super(props, context)
    this.state = {
      data: []
    }
  }
  public componentWillMount() {
    const app = this.props[STORE_APP] as AppStore
    app.setTitle("销售列表")
    httpAll(
      (a, b) => {
        console.log(a, b)
      },
      httpGet("/test/1.json"),
      httpGet("http://jsonplaceholder.typicode.com/posts/2")
    )
  }
  public componentDidMount() {
    const table = this.refs.table as Table<any>
    console.log("用ref 控制查看子组件,可以代用子组件方法")
    console.log(table.columns)
  }
  public onSubmit = e => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        console.log("假装我去 请求了")
        console.log("我要赋值了")
        this.setState({
          data: [
            {
              key: "1",
              name: "John Brown",
              age: 32,
              address: "New York No. 1 Lake Park"
            },
            {
              key: "2",
              name: "Jim Green",
              age: 42,
              address: "London No. 1 Lake Park"
            },
            {
              key: "3",
              name: "Joe Black",
              age: 32,
              address: "Sidney No. 1 Lake Park"
            }
          ]
        })
      }
    })
  }
  public checkTest = (rule, value, callback) => {
    const form = this.props.form
    if (value && !String(value).startsWith("/")) {
      callback("should start with /")
    } else {
      callback()
    }
  }
  public resetForm = () => {
    this.props.form.resetFields()
  }
  public render() {
    const { form } = this.props
    const { data } = this.state
    const { getFieldDecorator } = form
    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: text => <a href="#">{text}</a>
      },
      {
        title: "Age",
        dataIndex: "age",
        key: "age"
      },
      {
        title: "Address",
        dataIndex: "address",
        key: "address"
      },
      {
        title: "Action",
        key: "action",
        render: (text, record) => (
          <span>
            <a href="#">Action 一 {record.name}</a>
            <Divider type="vertical" />
            <a href="#">Delete</a>
            <Divider type="vertical" />
            <a href="#" className="ant-dropdown-link">
              More actions <Icon type="down" />
            </a>
          </span>
        )
      }
    ]
    return (
      <div>
        <Form className="ant-advanced-search-form">
          <Row gutter={24}>
            <Col span={8} key="1">
              <FormItem label={`Fieluud ${1}`}>
                {getFieldDecorator(`field-${1}`, {
                  rules: [
                    { required: true },
                    {
                      validator: this.checkTest
                    }
                  ]
                })(<Input placeholder="placeholder" />)}
              </FormItem>
            </Col>
            <Col span={8} key="2">
              <FormItem label={`Field ${2}`}>
                {getFieldDecorator(`field-${2}`, {
                  rules: [{ required: true }]
                })(<Input placeholder="placeholder" />)}
              </FormItem>
            </Col>
            <Col span={8} key="3">
              <FormItem label={`Field ${3}`}>
                {getFieldDecorator(`password`, {
                  rules: [{ required: true }]
                })(<Input placeholder="placeholder" />)}
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: "right" }}>
              <Button onClick={this.onSubmit} type="primary" htmlType="submit">
                Search
              </Button>
              <Button onClick={this.resetForm} style={{ marginLeft: 8 }}>
                Clear
              </Button>
              <a style={{ marginLeft: 8, fontSize: 12 }}>
                Collapse <Icon type="up" />
              </a>
            </Col>
          </Row>
        </Form>
        <br />
        <Table ref="table" columns={columns} dataSource={data} />
      </div>
    )
  }
}

export default Form.create()(Test)
