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

log = (...opts) => {
  console.log( '['+moment().format('M-D-YY H:mm')+'] -', opts.join(' ') );
}

let q = "CREATE TABLE IF NOT EXISTS `followers` (      "
 + " `id` int(11) NOT NULL auto_increment,             "
 + " `user_id` int(11) NOT NULL default '0',             "
// + " `cvfilename` varchar(250)  NOT NULL default '',   "    
// + " `cvpagenumber`  int(11) NULL,                     "
// + " `cilineno` int(11)  NULL,                         "
// + " `batchname`  varchar(100) NOT NULL default '',    "
// + " `type` varchar(20) NOT NULL default '',           "
// + " `data` varchar(100) NOT NULL default '',          "
 + " PRIMARY KEY  (`id`) );"
db.query( q, (error, results, fields) => {
  if ( error ) throw error;
  if ( results.warningCount == 0 ) log('Created table followers');
});

coolDown = (func) => {
  log('Cooling down...');
  setTimeout(func, 5000);
}

getFollowers = (query) => {
  return new Promise( (resolve, reject) => {
    let followers = [];
    getNext200Followers = (query) => {
      client.get('followers/list', query, function(error, response, raw){
        if ( error ) {
          return reject(error);
          //return log('[ERROR] -> ', JSON.stringify(error));
        }
        Array.prototype.push.apply(followers, response.users);
        if ( response.next_cursor > 0 ) {
          query.cursor = response.next_cursor;
          coolDown( () => { getNext200Followers(query); } );
        } else {
          resolve(followers);
        }
      });
    }
    getNext200Followers(query);
  });
}

getFriends = (query) => {
  return new Promise( (resolve, reject) => {
    let friends = [];
    getNext200Friends = (query) => {
      client.get('friends/list', query, function(error, response, raw){
        if ( error ) {
          return reject(error);
          //return log('[ERROR] -> ', JSON.stringify(error));
        }
        Array.prototype.push.apply(friends, response.users);
        if ( response.next_cursor > 0 ) {
          query.cursor = response.next_cursor;
          coolDown( () => { getNext200Friends(query); } );
        } else {
          resolve(friends);
        } 
      });
    } 
    getNext200Friends(query);
  });
} 

/*
getFollowers({
  user_id: 'michael_iriarte',
  count: 200,
  skip_status: true,
  include_user_entities: true,
  cursor: -1
}).then(followers => {
  log('followers:', followers.length);
}).then(()=>{
  return getFriends({
    user_id: 'michael_iriarte',
    count: 200,
    skip_status: true,
    include_user_entities: true,
    cursor: -1
  })
}).then(friends => {
  log('friends:', friends.length);
  db.end();
})
*/
Promise.all([
  getFollowers({
    user_id: 'michael_iriarte',
    count: 200,
    skip_status: true,
    include_user_entities: true,
    cursor: -1
  }),
  getFriends({
    user_id: 'michael_iriarte',
    count: 200,
    skip_status: true,
    include_user_entities: true,
    cursor: -1
  }) 
]).then(values => {
  log('followers:', values[0].length);
  log('friends:', values[1].length); 
  //db.end();
}, error => {
  log('[CAUGHT ERROR] -> ', JSON.stringify(error));
}).then( () => {
  db.end();
});

