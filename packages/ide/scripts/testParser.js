// TODO
const path = require('path')
const fs = require('fs')
const commandLineArgs = require('command-line-args')
const { parse }  = require('@babel/parser')
const parseOptions = {
  // parse in strict mode and allow module declarations
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true, // todo
  allowSuperOutsideMethod: true, // todo
  allowImportExportEverywhere: true, // todo
  sourceType: "module",
  plugins: ['jsx', 'classProperties']
}

const optionDefinitions = [
  { name: 'src', type: String, multiple: false, defaultOption: true, defaultValue: './' },
]

const options = commandLineArgs(optionDefinitions)
const pathToRead = path.resolve(process.cwd(), options.src)

async function recursive(currentPath) {
  const dirEntries = fs.readdirSync(currentPath, {withFileTypes: true})

  for( let dirEntry of dirEntries) {
    const currentFullPath = path.join(currentPath, dirEntry.name)

    if (dirEntry.isDirectory()) {
      if (dirEntry.name === 'node_modules') continue
      await recursive(currentFullPath)
    } else if(/\.js/.test(dirEntry.name)){
      const content = await fs.readFileSync(currentFullPath, {encoding: 'utf8'})
      try {
        parse(content, parseOptions)
      } catch(e) {
        console.log(currentFullPath)
      }
    }
  }

}

recursive(pathToRead).then(() => {
  console.log('done')
})


