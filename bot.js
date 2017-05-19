const mysql = require('mysql');
const moment = require('moment');
const config  = require('./config.private.json');
const Twitter = require('twitter');
const client  = new Twitter({
  consumer_key: config.CONSUMER_KEY,
  consumer_secret: config.CONSUMER_SECRET,
  access_token_key: config.TOKEN_KEY,
  access_token_secret: config.TOKEN_SECRET 
});
const db = mysql.createPool({
  connectionLimit : 10,
  host     : config.DB_HOST,
  user     : config.DB_USER,
  password : config.DB_PASSWORD,
  database : config.DB_NAME
});

const { coolDown, kill, log } = require('./bot/utils.js');
const { createUsersDB, createConnectionsDB, saveUsers } = require('./bot/db.js');
const { fetchFollowers, fetchFriends } = require('./bot/twitter-client.js');



// Run
Promise.all([
  createUsersDB(db),
  createConnectionsDB(db)
])
.then(res => {
  log('Connecting to Twitter API...');
  return Promise.all([
    fetchFollowers(client),
    fetchFriends(client),
  ]);
})
.catch(error => {
  return kill('[API ERROR] -> ', error);
})

.then(values => {
  return new Promise( (resolve, reject) => {
    if (!values) return reject('No Data!');
    resolve(values);
  }) 
})

.then( values => {
  log('Followers:', values[0].length);
  log('Friends:', values[1].length);
  return saveUsers( db,
    values[0], // followers
    values[1] // friends
  )
})
.catch(error => {
  return log('[DB ERROR] -> ', error);
})
.then( values => {
  let followers = values[0];
  let friends = values[1];
/*
  let connections = {};
  for ( let user of followers ) {
    let key = '_'+user.id
    if ( connections[key] ) {
      connections[key].isF
    } else {
      connections[key] = { user: :}
    }
  }
*/ 
  log('Updated user table successfully.');
})
.then( () => {
  log('Closing connection...');
  return db.end();
})
.catch(error => { 
  return log('[FATAL ERROR] -> ', error);
});



