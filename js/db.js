
// Initialize and create Users tabe if not exist
createTableUsers = (db) => {
  return new Promise( (resolve, reject) => {
    let q = "CREATE TABLE IF NOT EXISTS `users` (          "
     + " `id` int(11) NOT NULL default 0,                  " // -> id
     + " `profile_image` varchar(140) NOT NULL default '', " // -> profile_image_url_https
     + " `followers_count` int(11) NULL,                   " // -> followers_count
     + " `friends_count` int(11) NULL,                     " // -> friends_count
     + " `screen_name` varchar(40) NOT NULL default '',    " // -> screen_name
     + " `name` varchar(40) NOT NULL default '',           " // -> name
     + " `time_zone` varchar(40) NOT NULL default '',      " // -> time_zone
     + " `lang` varchar(4) NOT NULL default '',            " // -> lang
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
    let q = " CREATE TABLE IF NOT EXISTS `connections` (           "
     + " `id` int(11) NOT NULL default 0,                          "
     + " `is_follower` BOOLEAN NOT NULL default 0,                 "
     + " `is_friend` BOOLEAN NOT NULL default 0,                   "
     + " `timestamp` TIMESTAMP NULL, " // NOT NULL DEFAULT CURRENT_TIMESTAMP, "
     + " PRIMARY KEY  (`id`, `timestamp`) );                                    "
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
        profile_image: user.profile_image_url_https,
        followers_count: user.followers_count,
        friends_count: user.friends_count,
        screen_name: user.screen_name,
        name: user.name,
        time_zone: user.time_zone,
        lang: user.lang,
        timestamp: timestamp
      };

      q += ' (  ' + data.id +', "' + db.escape(data.profile_image) +'", '
        + data.followers_count +', ' + data.friends_count
        +', "' + data.screen_name +'", "' + data.name +'", "'
        + data.time_zone +'", "' + data.lang +'", "' + timestamp + '" ),'
    }
    q = q.slice(0, -1); // remove last coma
    q += " ON DUPLICATE KEY UPDATE profile_image=VALUES(profile_image),"
    q += " followers_count=VALUES(followers_count), friends_count=VALUES(friends_count),"
    q += " screen_name=VALUES(screen_name), name=VALUES(name), time_zone=VALUES(time_zone),"
    q += " lang=VALUES(lang), timestamp=VALUES(timestamp);"
    // log('Running query:', q);
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      return resolve([followers, friends]);
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
      q += ' (  ' + user.id + ', true, "' + timestamp + '" ),';
    q = q.slice(0, -1); // remove last coma
    q += " ON DUPLICATE KEY UPDATE is_follower=true;"
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      return resolve(fields);
    });
  });
}

// Save/Update friend connections
saveFriendConnections = (db, timestamp, users) => {
  return new Promise( (resolve, reject) => {
    let q = "INSERT INTO `connections` ( "
     + " `id`, `is_friend`, `timestamp` ) "
     + " VALUES ";
    for ( let user of users ) 
      q += ' (  ' + user.id + ', true, "' + timestamp + '" ),';
    q = q.slice(0, -1); // remove last coma
    q += " ON DUPLICATE KEY UPDATE is_friend=true;"
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      return resolve(fields);
    });
  });
}

getDailyReport = (db, timestamp) => {

}

module.exports = {
  createTableUsers: createTableUsers,
  createTableConnections: createTableConnections,
  saveUsers: saveUsers,
  saveFollowerConnections: saveFollowerConnections,
  saveFriendConnections: saveFriendConnections,
  getDailyReport: getDailyReport
}


