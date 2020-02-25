/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement from './createElement'
import Fragment from './Fragment';

const BracketBoundary = ['{', '}']

export function withSeparator(arr, item) {
  if (arr.length < 2) return arr
  return arr.reduce(( last, current, index) => {
    last.push(current)
    if (index !== arr.length - 1) last.push(<separator>{item}</separator>)
    return last
  }, [])
}

export function makeKeyword(name, leftSpace) {
  return <>{leftSpace ? <space>{` `}</space> : null}<keyword>{name}</keyword><space>{' '}</space></>
}

export function makeBlock({ Tag = Fragment, keyword, variable, boundaries, children, next, semicolon }) {
  return (
    <Tag>
      {keyword ? Array.isArray(keyword) ? (keyword.map(k =>makeKeyword(k))) : makeKeyword(keyword) : null}
      {keyword ? <space>{` `}</space> : null}
      {variable ? <variable role={variable.role}>{variable.value}</variable> : null}
      {children ? (boundaries ? withBoundary(boundaries, children) : children) : null}
      {next ? next : null}
      {semicolon ? <semicolon>;</semicolon> : null}
    </Tag>
  )
}

export function withBoundary(boundaries, child) {
  return (
    <>
      <boundary start>{boundaries[0]}</boundary>
      {child}
      <boundary end>{boundaries[1]}</boundary>
    </>
  )
}

