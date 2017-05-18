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
  console.log( '['+moment().format('MM-DD-YY H:mm:ss')+'] -', opts.join(' ') );
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
     + " PRIMARY KEY  (`id`, `user_id`) );"
//    log('Running query:', q);
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      if ( results.warningCount == 0 ) log('Created `users` table');
      resolve();
    });
  });
}

// Save/Update users 
saveUsers = (followers, friends) => {
  let users = {};
  makeUserFromFollower = data => {
    log('data:', data);
TO DO
    let { user }  { data: { id: user_id, profile_image_url_https: profile_image, followers_count, friends_count, screen_name, name, time_zone, lang } }; 
  // = data;
    // if ( users['_'+id] ) {
      // already exists, update
    //} else {
     //users['_'+id] = {
     
     //}
    log('user:', user);
    return user;
  }

  makeUserFromFriend = data => {
    return {};
  }
 
//  for ( let friend of friends )
//    users.push( makeUserFromFriend(friend) );
 
  for ( let follower of followers ) 
    users.push( makeUserFromFollower(follower) );



  return new Promise( (resolve, reject) => {
    let q = "INSERT INTO `users` ( "
     + " `user_id`, `profile_image`, `followers_count`, `friends_count`, "
     + " `screen_name`, `name`, `time_zone`, `lang` ) "
     + " VALUES ";
    for ( let user of users ) {
      const { id: user_id, profile_image_url_https: profile_image, followers_count, 
        friends_count, screen_name, name, time_zone, lang } = user;
      q += ' (  ' + user_id +', "' + db.escape(profile_image) +'", ' + followers_count +', ' + friends_count 
        +', "' + screen_name +'", "' + name +'", "' + time_zone +'", "' + lang +'" ),'
    }
    q = q.slice(0, -1); // remove last coma
    q += ";"
    log('Running query:', q);
    db.query( q, (error, results, fields) => {
      log('YO', error, results, fields)
      if ( error ) return reject(error);
      return resolve();
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
fetchFollowers = () => {
  let query = {
    user_id: 'michael_iriarte',
    count: 200,
    skip_status: true,
    include_user_entities: true,
    cursor: -1
  };
  return new Promise( (resolve, reject) => {
    let followers = [];
    fetchNext200Followers = (query) => {
      client.get('followers/list', query, function(error, response, raw){
        if ( error ) {
          return reject(JSON.stringify(error));
        }
        Array.prototype.push.apply(followers, response.users);
        if ( response.next_cursor > 0 ) {
          query.cursor = response.next_cursor;
          coolDown().then( () => { fetchNext200Followers(query); } );
        } else {
          resolve(followers);
        }
      });
    }
    fetchNext200Followers(query);
  });
}

// Fetch All Friends
fetchFriends = () => {
  let query = {
    user_id: 'michael_iriarte',
    count: 200,
    skip_status: true,
    include_user_entities: true,
    cursor: -1
  };
  return new Promise( (resolve, reject) => {
    let friends = [];
    fetchNext200Friends = (query) => {
      client.get('friends/list', query, function(error, response, raw){
        if ( error ) {
          return reject(JSON.stringify(error));
        }
        Array.prototype.push.apply(friends, response.users);
        if ( response.next_cursor > 0 ) {
          query.cursor = response.next_cursor;
          coolDown().then( () => { fetchNext200Friends(query); } );
        } else {
          resolve(friends);
        } 
      });
    } 
    fetchNext200Friends(query);
  });
} 

// Run
createDB()
/*
.then(res => {
  return Promise.all([
    fetchFollowers(),
    fetchFriends(),
  ]);
})
.catch(error => {
  return log('[API ERROR] -> ', error);
})
*/
.then(values => {

values = require('./values.json').values;
   
  return new Promise( (resolve, reject) => {
    if (!values) return reject('No Data!');
    log('followers:', values[0].length);
    log('friends:', values[1].length);
   
// log('***********************', JSON.stringify(values), '************************');
    resolve(values[0], values[1]);
  }) 
})
.then( (followers, friends)=>{
// log('followers:', followers);
  return saveUsers( followers, friends )
})
.catch(error => {
  return log('[DB ERROR] -> ', error);
})
.then( () => {
  return db.end();
})
.catch(error => { 
  return log('[FATAL ERROR] -> ', error);
});



