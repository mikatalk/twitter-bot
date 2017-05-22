const config  = require('./../config.private.json');
const moment = require('moment');
const Email = require('email').Email

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

// email report
emailReport = (report) => {
  return new Promise((resolve, reject) => {
    let email = new Email({ 
      from: config.EMAIL_SENDER,
      to: config.EMAIL_RECIPIENT, 
      subject: config.EMAIL_SUBJECT,
      body: report
    });
    email.send( error => {
      if ( error ) reject(error);
      else resolve(report);
    });
  });
}

module.exports = {
  coolDown: coolDown,
  kill: kill,
  log: log,
  emailReport: emailReport
};

