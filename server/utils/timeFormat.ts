import * as moment from "moment"

// 01:30 -> 1:30

export const removeLeftPaddingTime = (i: string) => {
  const arr = i.split(":")
  return `${parseInt(arr[0])}:${arr[1]}`
}

// export const getEndOfNextMonth = (m: number) => {
//   return moment
//     .unix(m)
//     .add(1, 'months')
//     .unix()
// }
