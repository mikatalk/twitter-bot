
// Fetch All Followers
fetchFollowers = (client) => {
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
fetchFriends = (client) => {
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

module.exports = {
  fetchFollowers: fetchFollowers,
  fetchFriends: fetchFriends
};

