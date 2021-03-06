const path = require('path')
const fs = require('fs')
const moduleErr = require('../../utils/moduleErr.js')
const Database = require('../PropertiesExtension.js')
const getFolder = require('./getFolder.js')
const crypto = require('crypto')

function loader(options, paths, config) {
  const pathway = {}
  const loaded = {}
  let iterationId = 0;
  const configKeys = config ? Object.keys(config) : []

  if (configKeys.length > 0) {
    for (let opts of Object.values(config)) {
      let filter = [opts].filter(select => select?.forceLoad || select?.createIfNotExists)
      if (filter.length > 0) pathway[configKeys[iterationId]] = filter[0]

      iterationId++
    }
  }

  paths.forEach((item, i) => {
    if (typeof item == 'object') return;

    let name = item.replace('.sqlite', '').match(/\w+$/g);
    name = name ?? [`data${i}`];

    if (pathway[name[0]]) return;
    pathway[name[0]] = path.resolve(item)
    //get all the resolve paths
  });

  let keys = Object.keys(pathway)
  if (
    !options?.memory &&
    !options?.file &&
    !options?.folder
  ) throw new moduleErr(`Activa alguna de estas propiedades para actuar: memory | file | folder`)

  if (options?.memory) {
    loaded['memory'] = new Database(':memory:')
  }

  if (options?.file) {
    loaded['files'] = {}
    
    if (keys.length < 1) throw new moduleErr('Añade archivos de SQLite')

    let array = []

          for (let x of keys) {
            try {
              fs.readFileSync(pathway[x])
            } catch(err) {
              let props = pathway[x];

              if (props.createIfNotExists || props.forceLoad) {
                pathway[x] =
                  ((props.path || config.defaultFileStorage) && (props.createIfNotExists || props.forceLoad)
                    ? getFolder(props.path ?? config.defaultFileStorage)
                    : props.forceLoad
                    ? process.cwd()
                    : undefined) +
                  `${"\\"[0] + (x.match(/data[0-9]+/gm) ? "" : x)}.sqlite`;
                
                if (!fs.existsSync(pathway[x])) fs.writeFileSync(pathway[x], '')
              } else throw new moduleErr(`Ha habido un error al acceder a los archivos. Error completo:\n${err.message}`)
            }

            if (pathway[x].match(/.\w+$/g)[0] !== '.sqlite') throw new moduleErr(`Ha sido cargado un archivo que no es sqlite: ${pathway[x]}`)

            array.push({path: pathway[x], name: x})
          }

          array.forEach(file => {
              loaded.files[file.name] = new Database(file.path)
              loaded.files[file.name].inFolder = false
              loaded.files[file.name].fileName = file.name
              loaded.files[file.name].Path = file.path
              loaded.files[file.name].Id = crypto.randomBytes(16).toString('hex')
          });

          return loaded
  }

  else if (options?.folder) {
    loaded['folders'] = {}

    if (keys.length < 1) throw new moduleErr('Añade carpetas')

      let dir;
      let array = []
      let previousPaths = []// to compare previous with other path XD

    for (let x of keys) {
      try {
        let props = pathway[x];

        if (props.forceLoad || props.createIfNotExists)
        props =
          (props.path || config.defaultFileStorage) &&
          (props.createIfNotExists || props.forceLoad)
            ? getFolder(props.path ?? config.defaultFileStorage)
            : props.forceLoad
            ? process.cwd()
            : null;

        if (props && previousPaths.includes(props)) continue;

        dir = fs.readdirSync(props);
        pathway[x] = props
        previousPaths.push(props);
      } catch(err) {
        throw new moduleErr(`Ha habido un error al acceder a los archivos. Error completo:\n${err.message}`)
      }

      let folderPath = pathway[x]
      let folderName = folderPath.match(/\w+$/g)
      let files = dir.filter(x => x.match(/.\w+$/g) == '.sqlite')

      if (files.length < 1) throw new moduleErr(`No se ha encontrado ninguna base de datos en la carpeta`)
      array.push({
        files: files,
        path: folderPath,
        name: folderName
      })
    }

          array.forEach((object) => {
            let files = {}

            object.files.forEach((file, i) => {
              let fileName = file.replace('.sqlite', '')
              fileName = fileName == '' ? `data${i}` : fileName

                files[fileName] = new Database(path.resolve(object.path, file))
                files[fileName].inFolder = object.name[0]
                files[fileName].fileName = fileName
                files[fileName].Path = path.resolve(object.path, file)
                files[fileName].Id = crypto.randomBytes(16).toString("hex");
            });//set the path of folder files

              loaded.folders[object.name] = files
          });

          return loaded
  }

  return loaded
}

module.exports = loader;
