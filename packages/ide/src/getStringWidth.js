const PRESETTING_CHARACTERS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()-=_+;\'",./<>?[]\\{}|'

const widthMap = {}

const container = document.createElement('span')
container.style.visible = 'hidden'
container.style.position = 'static'
container.style.left = '-100px'
document.body.appendChild(container)

PRESETTING_CHARACTERS.split('').forEach(getCharacterWidth)

function getCharacterWidth(c) {
  container.innerText = c
  widthMap[c] = container.getBoundingClientRect().width
  return widthMap[c]
}

// document.body.removeChild(container)

console.log(widthMap)

export default function getStringWidth(str) {
  return str.split('').reduce((result, c) => {
    return result + (widthMap[c] || getCharacterWidth(c))
  }, 0)
}
