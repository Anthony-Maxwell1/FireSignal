const websocket = require('ws');
const bcrypt = require("bcrypt")
const saltRounds = 10
const wss = new websocket.Server({ port: 8080 });
const fs = require('fs');
let currIndex = 0;
let fires = 'fires.json';
let hashes = 'logins.json';
let data = JSON.parse(fs.readFileSync(fires));

wss.on('connection', (ws) => {
    console.log('A client connected.');
    console.log('Sending data to the client...');
    ws.send(JSON.stringify({ 'type': 'fires', 'data': data }));

    ws.on('message', (message) => {
        console.log('Received message:', message);

        try {
            // Attempt to parse the message as JSON
            const decodedMessage = JSON.parse(message);

            // Check if the parsed message is an object
            if (typeof decodedMessage === 'object' && decodedMessage !== null) {
                if (decodedMessage['type'] == 'report') {
                    currIndex += 1;
                    data[currIndex.toString()] = decodedMessage['data'];
                    fs.writeFileSync(fires, JSON.stringify(data, null, 2), 'utf-8');
                    console.log('Received valid JSON message:', decodedMessage['data']);
                    ws.send(JSON.stringify({ 'type': 'msg', 'data': 'Reported Fire.' }));
                }
                
                if (decodedMessage['client'] == 'firefighter') {
                    if (decodedMessage['type'] == 'sign-in') {
                        sign_in(decodedMessage['data']['username'], decodedMessage['data']['password'], decodedMessage['data']['organisation'])
                    }
                }
            } else {
                console.log('Received non-object JSON:', decodedMessage);
                currIndex += 1;
                data[currIndex.toString()] = decodedMessage;
                console.log(data[currIndex.toString()])
                console.log(JSON.stringify(data, null, 2))
                fs.writeFileSync(fires, JSON.stringify(data, null, 2), 'utf-8');
                ws.send(JSON.stringify({ 'type': 'msg', 'data': 'Reported Fire.' }));
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });

    ws.on('close', () => {
        console.log('A client disconnected.');
    });
});

function encrypt_password(password) {
    bcrypt.hash(password, saltRounds)
        .then(hash => {
            return hash
        })
        .catch(err => console.error(err.message))
}

function compare_password(password, hash) {
    bcrypt.compare(password, hash)
        .then(res => {
            return res
        })
        .catch(err => console.log(err))
}

function sign_in(username, password, organisation) {
    return compare_password(password, JSON.parse(fs.readFileSync(hashes))[organisation + '/' + username])
}