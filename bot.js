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

// Pretty logs
log = (...opts) => {
  console.log( '['+moment().format('M-D-YY H:mm')+'] -', opts.join(' ') );
}

// Initialize and create DB if not exist
createDB = () => {
  return new Promise( (resolve, reject) => {
    let q = "CREATE TABLE IF NOT EXISTS `users` (          "
     + " `id` int(11) NOT NULL auto_increment,             "
     + " `user_id` int(11) NOT NULL default '0',           " // -> id
     + " `profile_image` varchar(140) NOT NULL default '', " // -> profile_image_url_https
     + " `followers_count` int(11) NULL,                   " // -> followers_count
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

// Save/Update users 
saveUsers = (users) => {
  return new Promise( (resolve, reject) => {
    let q = "INSERT INTO `users` ( "
     + " `user_id`, `profile_image`, `followers_count`, `friends_count`, "
     + " `screen_name`, `name`, `time_zone`, `lang` ) "
     + " VALUES ";
    for ( let user of users ) {
      const { id: user_id, profile_image, followers_count, friends_count, screen_name, name, time_zone, lang } = user;
      q += '(  `' + user_id +'`, `' + profile_image +'`, `' + followers_count +'`, `' + friends_count +'`, `'
      q += screen_name +'`, `' + name +'`, `' + time_zone +'`, `' + lang +'`,  ), '
    }
    q = q.slice(0, -1); // remove last coma
    q += ";"
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      else resolve();
    });
  });
}

// Delay requests to prevent blocking the bot from twitter 
coolDown = (ms) => {
  ms = ms || 5000;   
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

// Fetch All Followers
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
        }
        Array.prototype.push.apply(followers, response.users);
        if ( response.next_cursor > 0 ) {
          query.cursor = response.next_cursor;
          coolDown().then( () => { getNext200Followers(query); } );
        } else {
          resolve(followers);
        }
      });
    }
    getNext200Followers(query);
  });
}

// Fetch All Friends
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
        }
        Array.prototype.push.apply(friends, response.users);
        if ( response.next_cursor > 0 ) {
          query.cursor = response.next_cursor;
          coolDown().then( () => { getNext200Friends(query); } );
        } else {
          resolve(friends);
        } 
      });
    } 
    getNext200Friends(query);
  });
} 

// Run
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


