const path = require('path')
const fs = require('fs')
const commandLineArgs = require('command-line-args')
const { Code, Category, syncTables } = require('./database')

const optionDefinitions = [
  { name: 'src', type: String, multiple: false, defaultOption: true, defaultValue: './' },
]

const options = commandLineArgs(optionDefinitions)

const pathToRead = path.resolve(process.cwd(), options.src)
async function recursive(currentPath, parentCategoryId) {
  const dirEntries = fs.readdirSync(currentPath, {withFileTypes: true})

  for( let dirEntry of dirEntries) {
    console.log(dirEntry)
    const currentFullPath = path.join(currentPath, dirEntry.name)

    if (dirEntry.isDirectory()) {
      if (dirEntry.name === 'node_modules') continue
      const category = await Category.create({name: dirEntry.name, parentId: parentCategoryId})
      // console.log({name: dirEntry.name, parentId: parentCategoryId})
      await recursive(currentFullPath, category.id)
    } else {
      const content = await fs.readFileSync(currentFullPath, {encoding: 'utf8'})
      await Code.create({name: dirEntry.name, content, categoryId: parentCategoryId})
      // console.log({name: dirEntry.name, categoryId: parentCategoryId})
    }
  }

}

syncTables()
recursive(pathToRead).then(() => {
  console.log('done')
})


