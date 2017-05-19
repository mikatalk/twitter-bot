const moment = require('moment');

// Delay requests to prevent blocking the bot from twitter 
coolDown = (ms) => {
  ms = ms || 5000;   
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

// exit app
kill = (...error) => {
  if (error) log(error);
  process.exit();
}

// pretty logs
log = (...opts) => {
  console.log( '['+moment().format('MM-DD-YY H:mm:ss')+'] -', opts.join(' ') );
}

module.exports = {
  coolDown: coolDown,
  kill: kill,
  log: log,
};

