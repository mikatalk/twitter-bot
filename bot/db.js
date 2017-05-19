// Initialize and create DB if not exist
createUsersDB = (db) => {
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
     + " `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     + " PRIMARY KEY  (`id`) );                            "
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      if ( results.warningCount == 0 ) log('Created `users` table');
      resolve();
    });
  });
}

createConnectionsDB = (db) => {
  return new Promise( (resolve, reject) => {
    log('Initializing...');
    let q = " CREATE TABLE IF NOT EXISTS `connections` (           "
     + " `id` int(11) NOT NULL default 0,                          "
     + " `is_follower` int(11) NOT NULL default 0,                 "
     + " `is_friend` int(11) NOT NULL default 0,                   "
     + " `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "
     + " PRIMARY KEY  (`id`) );                                    "
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      if ( results.warningCount == 0 ) log('Created `connections` table');
      resolve();
    });
  });
}

// Save/Update users
saveUsers = (db, followers, friends) => {
  let users = followers.concat(friends);

  return new Promise( (resolve, reject) => {
    let q = "INSERT INTO `users` ( "
     + " `id`, `profile_image`, `followers_count`, `friends_count`, "
     + " `screen_name`, `name`, `time_zone`, `lang` ) "
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
        lang: user.lang
      };

      q += ' (  ' + data.id +', "' + db.escape(data.profile_image) +'", '
        + data.followers_count +', ' + data.friends_count
        +', "' + data.screen_name +'", "' + data.name +'", "'
        + data.time_zone +'", "' + data.lang +'" ),'
    }
    q = q.slice(0, -1); // remove last coma
    q += " ON DUPLICATE KEY UPDATE profile_image=VALUES(profile_image),"
    q += " followers_count=VALUES(followers_count), friends_count=VALUES(friends_count),"
    q += " screen_name=VALUES(screen_name), name=VALUES(name), time_zone=VALUES(time_zone),"
    q += " lang=VALUES(lang);"
    // log('Running query:', q);
    db.query( q, (error, results, fields) => {
      if ( error ) return reject(error);
      return resolve([followers, friends]);
    });
  });
}

module.exports = {
  createUsersDB: createUsersDB,
  createConnectionsDB: createConnectionsDB,
  saveUsers: saveUsers
}


