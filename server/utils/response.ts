import { Response } from "express"
import { ErrorEnum } from "../const/error"

export class ErrorMessage {
  public code: number
  public message: string
  constructor(error: IErrorType) {
    this.code = error.code
    this.message = error.message
  }
}
export function respondJSON(
  res: Response,
  result: boolean,
  data: object,
  error: IErrorType | null = null,
  statusCode?: number
) {
  statusCode = statusCode || 200
  res.status(statusCode).json({
    success: result,
    timestamp: new Date().valueOf(),
    data,
    error
  })
}

export const reponseErrorMsg = (res: Express.Response, error: IErrorType) => {
  this.respondJSON(res, false, null, new ErrorMessage(error))
}

export const reponseData = (res: Express.Response, data: Object) => {
  this.respondJSON(res, true, data, null)
}