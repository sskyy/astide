const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const VirtualModulePlugin = require('virtual-module-webpack-plugin')
const path = require('path')
const loaderUtils = require('loader-utils')

const babelTemplate = require("@babel/template").default
const babelGenerate = require("@babel/generator").default
const t  = require("@babel/types")

// function buildTemplate(templateStr) {
//   const templateFn = babelTemplate(templateStr, { placeholderPattern: false, placeholderWhitelist: new Set(['URL']) })
//   console.log(templateStr)
//   return function translate(variables) {
//     return babelGenerate(templateFn(variables)).code
//   }
// }

function buildTemplate(templateStr) {
  return function(subs) {
    let result = templateStr
    Object.entries(subs).forEach(([key, node]) => {
      result = result.replace(new RegExp(key, 'i'), node.value)
    })
    return result
  }
}

const {Union} = require('unionfs');
const { fs: mfs } = require('memfs');
const fs = require('fs');
const ufs = new Union();
ufs.use(mfs).use(fs);

module.exports = function createIframeLoader({ entry, host }) {
  const entryTemplate = fs.readFileSync(entry, 'utf8')
  const hostTemplate = fs.readFileSync(host, 'utf8')
  const buildHost = buildTemplate(hostTemplate)

  function loader() {}

  loader.pitch = function(request) {
    const compiler = createCompiler(this, request, entryTemplate, {
      filename: path.basename(request),
    });
    runCompiler(compiler, buildHost, this.async());
  }

  return loader
}

// TODO request 加上入口文件。里面要有如何挂载组件/rpc
function createCompiler(loader, request, entryTemplate, options) {
  const virtualEntryName = './axiiVirtualEntry.js'
  const virtualPath = path.resolve(process.cwd(), virtualEntryName)
  const entryContent = `import App from '${request}'; ${entryTemplate}`
  // console.log(Object.keys(loader.fs).filter((k) => typeof loader.fs[k] === 'function').join(','))
  // const writeResult = mfs.writeFileSync(virtualEntryName, entryContent)
  const writeResult = fs.writeFileSync(virtualPath, entryContent)
  // console.log(mfs.readFileSync(filePath, 'utf8'))

  const plugin = new SingleEntryPlugin(loader.context, virtualPath, 'main')
  const childCompiler = getCompilation(loader).createChildCompiler('axii-iframe', options);
  // compiler.inputFileSystem = mfs
  childCompiler.apply(plugin)

  // const subCache = 'subcache ' + __dirname + ' ' + request;
  // compiler.plugin('compilation', function(compilation) {
  //   if (!compilation.cache) {
  //     return;
  //   }
  //   if (!compilation.cache[subCache]) {
  //     compilation.cache[subCache] = {};
  //   }
  //   compilation.cache = compilation.cache[subCache];
  // });
  return childCompiler;
}


function runCompiler(compiler, buildHost, callback) {
  compiler.runAsChild(function(error, entries) {
    if (error) {
      callback(error);
    } else if (entries[0]){
      const url = entries[0].files[0];
      callback(null, buildHost({ __URL__: t.stringLiteral(url)}))
    } else {
      callback(null, null);
    }
  });
}


function getCompilation(loader) {
  return loader._compilation;
}


