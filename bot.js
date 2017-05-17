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

createDB = () => {
  return new Promise( (resolve, reject) => {
    let q = "CREATE TABLE IF NOT EXISTS `users` (          "
     + " `id` int(11) NOT NULL auto_increment,             "
     + " `user_id` int(11) NOT NULL default '0',           " // -> id
     + " `profile_image` varchar(140) NOT NULL default '', " // -> profile_image_url_https
     + " `follower_count` int(11) NULL,                    " // -> followers_count
     + " `friends_count` int(11) NULL,                     " // -> friends_count
     + " `screen_name` varchar(40) NOT NULL default '',    " // -> screen_name
     + " `name` varchar(40) NOT NULL default '',           " // -> name
     + " `time_zone` varchar(40) NOT NULL default '',      " // -> time_zone
     + " `lang` varchar(4) NOT NULL default '',            " // -> lang
     + " PRIMARY KEY  (`id`) );"
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      if ( results.warningCount == 0 ) log('Created table followers');
      resolve();
    });
  });
}

/*********************
INSERT INTO tbl_name
    (a,b,c)
VALUES
    (1,2,3),
    (4,5,6),
    (7,8,9);
**********************/

coolDown = (func) => {
  log('Cooling down...');
  setTimeout(func, 5000);
}

getFollowers = () => {
  let query = {
    user_id: 'michael_iriarte',
    count: 200,
    skip_status: true,
    include_user_entities: true,
    cursor: -1
  };
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

getFriends = () => {
  let query = {
    user_id: 'michael_iriarte',
    count: 200,
    skip_status: true,
    include_user_entities: true,
    cursor: -1
  };
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

createDB()
  .then(res => {
    return Promise.all([
      getFollowers(),
      getFriends(),
    ]);
  })
  .then(values => {
    log('followers:', values[0].length);
    log('friends:', values[1].length);
  }, error => {
    log('[CAUGHT ERROR] -> ', JSON.stringify(error));
  })
  .then( () => {
    db.end();
  });


