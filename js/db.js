const moment = require('moment');

// Initialize and create Users tabe if not exist
createTableUsers = (db) => {
  return new Promise( (resolve, reject) => {
    let q = "CREATE TABLE IF NOT EXISTS `users` (          "
     + " `id` bigint(20) NOT NULL DEFAULT 0,               " // -> id
     + " `profile_image` varchar(140) NOT NULL DEFAULT '', " // -> profile_image_url_https
     + " `followers_count` int(11) NULL,                   " // -> followers_count
     + " `friends_count` int(11) NULL,                     " // -> friends_count
     + " `screen_name` varchar(40) NOT NULL DEFAULT '',    " // -> screen_name
     + " `name` varchar(40) NOT NULL default '',           " // -> name
     + " `time_zone` varchar(40) NOT NULL DEFAULT '',      " // -> time_zone
     + " `lang` varchar(4) NOT NULL DEFAULT '',            " // -> lang
     + " `timestamp` TIMESTAMP NULL, " // NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     + " PRIMARY KEY  (`id`) );                            "
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      if ( results.warningCount == 0 ) log('Created `users` table');
      resolve();
    });
  });
}

// Initialize and create Connections table if not exist
createTableConnections = (db) => {
  return new Promise( (resolve, reject) => {
    let q = " CREATE TABLE IF NOT EXISTS `connections` (    "
     + " `id` bigint(20) NOT NULL DEFAULT 0,                "
     + " `is_follower` BOOLEAN NOT NULL DEFAULT 0,          "
     + " `is_friend` BOOLEAN NOT NULL DEFAULT 0,            "
     + " `timestamp` TIMESTAMP NULL, " // NOT NULL DEFAULT CURRENT_TIMESTAMP, "
     + " PRIMARY KEY  (`id`, `timestamp`) );                "
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      if ( results.warningCount == 0 ) log('Created `connections` table');
      resolve();
    });
  });
}

// Save/Update users
saveUsers = (db, timestamp, followers, friends) => {
  let users = followers.concat(friends);
  return new Promise( (resolve, reject) => {
    let q = "INSERT INTO `users` ( "
     + " `id`, `profile_image`, `followers_count`, `friends_count`, "
     + " `screen_name`, `name`, `time_zone`, `lang`, `timestamp` ) "
     + " VALUES ";
    for ( let user of users ) {
      let data = {
        id: user.id,
        profile_image: db.escape(user.profile_image_url_https),
        followers_count: user.followers_count,
        friends_count: user.friends_count,
        screen_name: db.escape(user.screen_name),
        name: db.escape(user.name),
        time_zone: user.time_zone,
        lang: user.lang,
        timestamp: timestamp
      };

      q += ' (  ' + data.id +', "' + db.escape(data.profile_image) +'", '
        + data.followers_count +', ' + data.friends_count
        +', "' + db.escape(data.screen_name) +'", "' + db.escape(data.name) +'", "'
        + data.time_zone +'", "' + data.lang +'", "' + timestamp + '" ),'
    }
    q = q.slice(0, -1); // remove last coma
    q += " ON DUPLICATE KEY UPDATE profile_image=VALUES(profile_image),"
    q += " followers_count=VALUES(followers_count), friends_count=VALUES(friends_count),"
    q += " screen_name=VALUES(screen_name), name=VALUES(name), time_zone=VALUES(time_zone),"
    q += " lang=VALUES(lang), timestamp=VALUES(timestamp);"
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      resolve([followers, friends]);
    });
  });
}

// Save/Update follower connections
saveFollowerConnections = (db, timestamp, users) => {
  return new Promise( (resolve, reject) => {
    let q = "INSERT INTO `connections` ( "
     + " `id`, `is_follower`, `timestamp` ) "
     + " VALUES ";
    for ( let user of users )
      q += ' (  ' + user.id + ', 1, "' + timestamp + '" ),';
    q = q.slice(0, -1); // remove last coma
    q += " ON DUPLICATE KEY UPDATE is_follower=1;"
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      resolve(results);
    });
  });
}

// Save/Update friend connection
saveFriendConnections = (db, timestamp, users) => {
  return new Promise( (resolve, reject) => {
    let q = "INSERT INTO `connections` ( "
     + " `id`, `is_friend`, `timestamp` ) "
     + " VALUES ";
    for ( let user of users ) 
      q += ' (  ' + user.id + ', 1, "' + timestamp + '" ),';
    q = q.slice(0, -1); // remove last coma
    q += " ON DUPLICATE KEY UPDATE is_friend=1;"
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      resolve(results);
    });
  });
}

// get daily saved connections
getDailySavedConnection = (db, timestamp) => {
  return new Promise( (resolve, reject) => {
    let q = 'SELECT * FROM `connections` WHERE timestamp="'+timestamp+'";';
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      resolve(results);
    });
  });
}

// Generate report between 2 dates
generateDailyReport = (db, today, yesterday) => {
  return new Promise( (resolve, reject) => {
    // collect both days of data
    return Promise.all([
      getDailySavedConnection(db, today), // select connections from today
      getDailySavedConnection(db, yesterday), // select connections from yesterday
    ]).catch(error => kill('[DB ERROR] -> ', error) )
    .then( values => {
      let merged = {};
      let friends = [];
      let followers = [];
      let newFriends = [];
      let lostFriends = [];
      let newFollowers = [];
      let lostFollowers = [];

      // parse today's connections
      for ( let user of values[0] ) {
        if ( user.is_friend ) friends.push(user.id);
        if ( user.is_follower ) followers.push(user.id);
        merged[user.id] = { is_friend: user.is_friend, is_follower: user.is_follower };
      }
      // parse yesterday's connections
      for ( let user of values[1] ) {
        if ( merged[user.id] ) {
          merged[user.id].was_friend = user.is_friend
          merged[user.id].was_follower = user.is_follower
        } else {
          merged[user.id] = { was_friend: user.is_friend, was_follower: user.is_follower };
        }
      }
      for ( let key in merged ) {
        let user = merged[key];
        if ( user.was_friend && !user.is_friend ) lostFriends.push(user);
        if ( !user.was_friend && user.is_friend ) newFriends.push(user);
        if ( user.was_follower && !user.is_follower ) lostFollowers.push(user);
        if ( !user.was_follower && user.is_follower ) newFollowers.push(user); 
      }
      let report = '\n'//------------------------\n'
       + '# day timestamp: ' + today.slice(0,8)         + '\n'
       + '# friends: ' + friends.length                 + '\n'
       + '# followers: ' + followers.length             + '\n'
       + '# new followers: ' + newFollowers.length      + '\n'
       + '# lost followers: ' + lostFollowers.length    + '\n'
       + '# new friends: ' + newFriends.length          + '\n'
       + '# lost friends: ' + lostFriends.length        + '\n'
       + '------------------------'
      resolve(report);
    })
  });
}


module.exports = {
  createTableUsers: createTableUsers,
  createTableConnections: createTableConnections,
  saveUsers: saveUsers,
  saveFollowerConnections: saveFollowerConnections,
  saveFriendConnections: saveFriendConnections,
  generateDailyReport: generateDailyReport
}


