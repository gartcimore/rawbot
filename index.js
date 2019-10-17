const tmi = require('tmi.js');

const specials_words = require('./words.js');

const fastify = require('fastify')({
  logger: true
});

const oauth_key = process.env.oauth_key;

var port = process.env.port;

var channels = [];

const tmiConfig = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: "gorawbot",
        password: oauth_key
    },
    channels: channels
};

const prefix = "!";

if (!port){
    port=3000;
}

fastify.get('/', function (request, reply) {
    reply.send("RawBot Index page. Go to /channels for a list of channels where I sit");
});

// Declare a route
fastify.get('/channels', function (request, reply) {
  reply.send({ channels: channels });
});

fastify.post('/channels', function (request, reply) {
  console.log(request.body);
    for (const channel of request.body) {
        console.log("found channel "+channel);
        channels.push(channel.name);
    }
  console.log("channels are now "+channels);
  if(channels.length > 0) {
      client.connect();
  }
  reply.send({ channels: channels });
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

function isSubscriber(user) {
    return user.subscriber;
}

function isModerator(user) {
    return user.mod;
}

function isBroadcaster(user) {
    return user.badges.broadcaster === '1';
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
                } else if (isBroadcaster(user)) {
                    client.say(channel, "Bonjour " + user['display-name'] + ",passe un bon stream !");
                } else if (isSubscriber(user)) {
                    client.say(channel, "Bonjour " + user['display-name'] + ",merci d'avoir souscris à cette chaine !");
                } else {
                    client.say(channel, "Bonjour à toi " + user['display-name'] + ",sois le bienvenu !");
                }
                break;
            case "help":
                client.say(channel, "aucune commande pour l'instant");
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
