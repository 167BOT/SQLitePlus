const DatabaseManager = require('../src/DatabaseManager'),
      Models = require('./models.js'),
      { resolve, join, sep } = require('path'),
      getFolder = require('../src/functions/getFolder')

const db = new DatabaseManager({file: true, configPath: './config.js'})

let myDB = db.db
/* console.log(db.get([
  'Guilds',
  {myGuild: 'XD', data: 1}
])) */

db.createFolder({name: 'test'})
db.moveContent({files: 'folders/tos', to: 'folders/test'})
//console.log(db);
return;

//myDB.prepare(`INSERT INTO Guilds(data) VALUES(?)`).run([JSON.stringify({name:'Lol'})])

//console.log(JSON.parse(myDB.replace(/^'|'$/gm, ''))) | A saber para que es esto xd

// let insert = db.insert([
//   'Test',
//   {
//     myGuild: {
//       data: {
//         name: 'El rincón del vago'
//         }
//       }
//     }
//   ])

let myGet = db.get([
  'Guilds',
  {
   data: {name: 'Lol'},
}
])

console.time()
console.log(myGet)
console.timeEnd()
