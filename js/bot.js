const fs = require('fs');
const mysql = require('mysql');
const moment = require('moment');
const config  = require('./../config.private.json');
const Twitter = require('twitter');
const client  = new Twitter({
  consumer_key: config.CONSUMER_KEY,
  consumer_secret: config.CONSUMER_SECRET,
  access_token_key: config.TOKEN_KEY,
  access_token_secret: config.TOKEN_SECRET 
});
const db = mysql.createPool({
  connectionLimit : 3,
  host     : config.DB_HOST,
  user     : config.DB_USER,
  password : config.DB_PASSWORD,
  database : config.DB_NAME
});
// process runs once a day so we use a fixed timestamp
const timestamp = moment().format('YY-MM-DD 00:00:00'); // 'YY-MM-DD hh:mm:ss'
// import functions
const { coolDown, kill, log } = require('./utils.js');
const { createTableUsers, createTableConnections, saveUsers,
  saveFollowerConnections, saveFriendConnections } = require('./db.js');
const { fetchFollowers, fetchFriends } = require('./twitter-client.js');


// Setup DB tables `Users` and `Connections`
Promise.all([
  createTableUsers(db),
  createTableConnections(db)
]).catch(error => kill('[DB ERROR] -> ', error) )
// Fetch Twitter Followers and Friends
.then(res => {
  log('Connecting to Twitter API');
  return Promise.all([
    fetchFollowers(client, config.TWITTER_HANDLE),
    fetchFriends(client, config.TWITTER_HANDLE),
  ]);
}).catch(error => kill('[API ERROR] -> ', error) )
// Save new users and daily connections
.then( values => {
  log('Updating `users` and `connections` table');
  followers = values[0];
  friends = values[1]; 
  return Promise.all([
    saveUsers(db, timestamp, followers, friends),
    saveFollowerConnections(db, timestamp, followers),
    saveFriendConnections(db, timestamp, friends)
  ]);
}).catch(error => kill('[DB ERROR] -> ', error) )
// Generate daily report
.then( (values) => {
  return generateDailyReport(db, timestamp);
}).catch(error => kill('[DB REPORT ERROR] -> ', error) )
// print daily report in a log file
.then( (values) => {
  log('Saving report');
  return fs.appendFile('./report.txt', 
    `[${timestamp.slice(0, 8)}] - followers: ${followers.length} - friends: ${friends.length}\n` );  
}).catch( error => kill('[FILE REPORT ERROR] -> ', error) )
// We're done here
.then( () => {
  log('Closing connection');
  return db.end();
}).catch(error => kill('[UNCAUGHT ERROR] -> ', error) );


