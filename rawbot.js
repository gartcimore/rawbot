const tmi = require('tmi.js');

const specials_words = require('./words.js');

const fs = require('fs');
const oauth = fs.readFileSync('oauth', 'utf8').toString();
const tmiConfig = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: "gorawbot",
        password: oauth
    },
    channels: [
        "gartcimore"
    ]
};

const prefix = "!";

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

client.connect();

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
