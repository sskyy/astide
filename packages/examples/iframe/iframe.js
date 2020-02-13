/** @jsx createElement */
import { createElement, render, createRef } from 'axii'
import ChildInIframe from 'axii-component-iframe!./ChildInIframe.js'

function App() {
  const childRef = createRef()

  setTimeout(() => {
    childRef.current.getValue().then(value => {
      console.log({value})
    }).then(() => {
      childRef.current.changeValue('frame change')
    })
  }, 100)

  return <div>
    <div>hello iframe</div>
    <ChildInIframe testProps="this is from parent" ref={childRef}/>
  </div>
}

render(<App />, document.getElementById('root'))

// /*********************************
//  *
//  */
//
// const root = document.getElementById('root')
// const iframe = document.createElement('iframe')
// root.appendChild(iframe)
//
// const getGeneratedPageURL = ({ html, css, js }) => {
//   const getBlobURL = (code, type) => {
//     const blob = new Blob([code], { type })
//     return URL.createObjectURL(blob)
//   }
//
//   const cssURL = getBlobURL(css, 'text/css')
//   const jsURL = getBlobURL(js, 'text/javascript')
//
//   const source = `
//     <html>
//       <head>
//         ${css && `<link rel="stylesheet" type="text/css" href="${cssURL}" />`}
//         ${js && `<script src="${jsURL}"></script>`}
//       </head>
//       <body>
//         ${html || ''}
//       </body>
//     </html>
//   `
//
//   return getBlobURL(source, 'text/html')
// }
//
//
// const url = getGeneratedPageURL({
//   html: '<p>Hello, world!</p>',
//   css: 'p { color: blue; }',
//   js: 'console.log("hi")'
// })
//
// iframe.src = url
