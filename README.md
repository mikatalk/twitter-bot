# twitter-bot
Mine twitter followers/friends and generate/email a report daily

## install
install *sendmail*
`sudo apt-get install sendmail`
download repo and install dependencies
`cd twitter-bot/`
`yarn`

## configuration
`cp config.example.json config.private.json`
gather your twitter API keys, create a mysql db, and edit the config file:
```
{
    "CONSUMER_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "CONSUMER_SECRET": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "TOKEN_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "TOKEN_SECRET": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "TWITTER_HANDLE": "michael_iriarte",
    "DB_HOST": "localhost",
    "DB_USER": "root",
    "DB_PASSWORD": "XXXXXXXXXX",
    "DB_NAME": "twitter_bot",
    "SEND_EMAIL": true,
    "EMAIL_SENDER": "twitter_bot@bots.pi",
    "EMAIL_RECIPIENT": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "EMAIL_SUBJECT": "Twitter Bot Stats"
}
```

## run
`node ./js/bot.js`

## setup cron job
`sudo vim /etc/crontab`
`sudo service cron reload`
#### Run once a day
`0 10 * * * root /projects/twitter-bot/ && node ./js/bot.js >> /projects/twitter-bot/logs.txt `


