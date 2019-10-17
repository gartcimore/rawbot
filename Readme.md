# RawBot
a simple Twitch bot in nodejs

[![Build Status](https://travis-ci.com/gartcimore/rawbot.svg?branch=master)](https://travis-ci.com/gartcimore/rawbot)

Provide twitch oauth api key through env key __oauth_key__
# launch
npm start

# add a channel 
post an array of channels, even for one channel
```bash
curl -d '[{"name":"gartcimore"}]' -H "Content-Type: application/json" -X POST http://localhost:3000/channels
```

# read connected channels
```bash
curl -X GET http://localhost:3000/channels
```