import Codebase from 'astide/ASTIDECodebase'

const codebase = new Codebase()




codebase.get(1).then(result => {
  console.log({result})
  if (!result) {
    console.log("no result, save one")
    codebase.save(1, "content", true)
  } else {
  }
})

codebase.outline().then(list => {
  console.log(list)
})



// codebase.persist()


