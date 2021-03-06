const tmi = require('tmi.js');

const specials_words = require('./words.js');

const fastify = require('fastify')({
    logger: true
});

const oauth_key = process.env.oauth_key;

var port = process.env.port;
var botName = process.env.name;

if (!botName) {
    botName = "gorawbot";
}

var channels = [];

const tmiConfig = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: botName,
        password: oauth_key
    },
    channels: channels
};

const prefix = "!";

if (!port) {
    port = 3000;
}

fastify.get('/', function (request, reply) {
    var response = '{"name":"' + client.getUsername + '", "channels": "' + client.getChannels() +
                   '", "state", "' + client.readyState + '"}';
    reply.code(200)
         .header('Content-Type', 'application/json; charset=utf-8')
         .send(response);
});

// Declare a route
fastify.get('/channels', function (request, reply) {
  if (client.readyState == "CLOSED" || client.readyState == "CLOSING") {
    reply.send({channels: channels});
  } else {
    reply.send({channels: client.getChannels});
  }

});

fastify.post('/channels', function (request, reply) {
    console.log(request.body);
    for (const channel of request.body) {
        console.log("found channel " + channel);
        channels.push(channel.name);
    }
    console.log("channels are now " + channels);
    if (channels.length > 0) {
        client.connect();
    }
    reply.send({channels: channels});
});

fastify.listen(Number(port), '0.0.0.0', function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`server listening on ${address}`);
});


function commandParser(message) {
    let prefixEscaped = prefix.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    let regex = new RegExp("^" + prefixEscaped + "([a-zA-Z]+)\s?(.*)");
    return regex.exec(message);
}

function isSubscriber(user, channel) {
    return user.subscribersoff(channel);
}

function isBroadcaster(user) {
    return user.badges.broadcaster === '1';
}

function isModerator(user) {
    return user.mod;
}

let client = new tmi.client(tmiConfig);

if (channels.length > 0) {
    client.connect();
}


client.on('connected', (address, port) => {
    console.log(`* Connected to ${address}:${port}`);
    client.action('gartcimore', "Bonjour, gorawbot bien connecté");
});
client.on('chat', (channel, user, message, isSelf) => {
    if (isSelf) return;

    let fullCommand = commandParser(message);

    if (fullCommand) {
        let command = fullCommand[1];
        let param = fullCommand[2];

        switch (command) {
            case "bonjour":
                if (isModerator(user)) {
                    client.say(channel, "Bonjour " + user['display-name'] + ",tu peux utiliser les commandes de modérateurs !");
                } else if (isSubscriber(user, channel)) {
                    client.say(channel, "Bonjour " + user['display-name'] + ",merci d'avoir souscris à cette chaine !");
                } else if (isBroadcaster(user)) {
                    client.say(channel, "Bonjour " + user['display-name'] + ",passe un bon stream !");
                } else {
                    client.say(channel, "Bonjour à toi " + user['display-name'] + ",sois le bienvenu !");
                }
                break;
            case "help":
                client.say(channel, "!bonjour, !help");
                break;
            default:
                client.say(channel, "Commande '" + command + "' (" + param + ")' non reconnue. Tapez " + prefix + "help pour la liste des commandes de " + client.getUsername());
        }
    } else {
        let words = message.toLowerCase().split(" ");
        for (let word of words) {
            let reaction = specials_words[word];
            if (reaction) {
                client.say(channel, reaction);
            }
        }
    }
});
