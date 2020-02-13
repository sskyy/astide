/** @jsx createElement */
import { createElement, useImperativeHandle, propTypes, ref } from 'axii'

export default function App({value}, ref) {
  useImperativeHandle(ref, {
    changeValue(next) {
      value.value = next
    },
    getValue() {
      return value.value
    }
  })

  return <div>{value}</div>
}

App.propTypes = {
  value: propTypes.string.default(() => ref('initial'))
}
