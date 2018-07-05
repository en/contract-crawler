'use strict'

const fs = require('fs')
const path = require('path')

const dataDir = path.resolve(__dirname, 'data')

fs.readFilePromise = function(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf-8', function(err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

fs.writeFilePromise = function(path, data) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, data, 'utf-8', function(err) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

fs.readdirPromise = function(dir) {
  return new Promise(function(resolve, reject) {
    fs.readdir(dir, function(err, files) {
      if (err) {
        reject(err)
      } else {
        resolve(
          files
            .filter(filename => filename.match(/^0x/))
            .map(fn => path.resolve(__dirname, 'data', fn))
        )
      }
    })
  })
}

fs.readdirPromise(dataDir).then(files => {
  files.forEach(file => {
    fs.readFilePromise(file).then(data => {
      const obj = JSON.parse(data)
      if (obj.result.length != 1) {
        console.log(obj.result[0].ContractName, obj.result.length)
      } else {
        const solPath = path.resolve(
          __dirname,
          'sol',
          obj.result[0].ContractName + '.sol'
        )
        fs.writeFilePromise(solPath, obj.result[0].SourceCode)
        console.log(`${solPath} saved.`)
      }
    })
  })
})
