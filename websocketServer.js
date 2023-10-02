const websocket = require('ws');
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');
const saltRounds = 10;
const wss = new websocket.Server({ port: 8080 });
const fs = require('fs');
const { decode } = require('punycode');
let currIndex = 0;
let fires = 'fires.json';
let hashes = 'logins.json';
let data = JSON.parse(fs.readFileSync(fires));
let sessions = {};

wss.on('connection', (ws) => {
    console.log('A client connected.');
    console.log('Sending data to the client...');
    ws.send(JSON.stringify({ 'type': 'fires', 'data': data }));
    update()

    ws.on('message', async (message) => {
        update()
        console.log('Received message:', message);

        try {
            // Attempt to parse the message as JSON
            const decodedMessage = JSON.parse(message);

            // Check if the parsed message is an object
            if (typeof decodedMessage === 'object' && decodedMessage !== null) {
                if (decodedMessage['type'] == 'report') {
                    currIndex += 1;
                    if (decodedMessage['client'] == 'firefighter') {
                        if (sessions[ws] != undefined) {
                            data[currIndex.toString()] = {'loc': decodedMessage['data'], 'verified': true};
                        }
                        
                    } else {
                        data[currIndex.toString()] = {'loc': decodedMessage['data'], 'verified': false};
                    }
                    fs.writeFileSync(fires, JSON.stringify(data, null, 2), 'utf-8');
                    console.log('Received valid JSON message:', decodedMessage['data']);
                    ws.send(JSON.stringify({ 'type': 'msg', 'data': 'Reported Fire.' }));
                }
                
                if (decodedMessage['client'] == 'firefighter') {
                    if (decodedMessage['type'] == 'sign-in') {
                        console.log(decodedMessage['data']['username'], decodedMessage['data']['password'], decodedMessage['data']['organization'])
                        console.log(encrypt_password(decodedMessage['data']['password']))
                        console.log('hello')
                        if (await sign_in(decodedMessage['data']['username'], decodedMessage['data']['password'], decodedMessage['data']['organization']) == true) {
                            let session = uuidv4()
                            sessions[ws] = session
                            ws.send(JSON.stringify({ 'type': 'sign_in-success', 'data': session }));
                        } else {
                            ws.send(JSON.stringify({ 'type': 'sign_in-fail' }));
                        }
                    } else if (sessions[ws] != undefined) {
                        if (decodedMessage['type'] == 'verify') {
                            console.log(decodedMessage['data']['fire']);
                            for (let e in data) {
                                console.log(data[e]);
                                
                                if (
                                    data[e].loc === decodedMessage['data']['fire'].loc &&
                                    data[e].verified === decodedMessage['data']['fire'].verified
                                ) {
                                    data[e]['verified'] = true;
                                    fs.writeFileSync(fires, JSON.stringify(data, null, 2), 'utf-8');
                                }
                            }
                            console.log(data);
                        }
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

async function encrypt_password(password) {
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(hash);
        return hash;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
}

async function compare_password(password, hash, organization, username) {
    if (JSON.parse(fs.readFileSync(hashes))[organization + '/' + username] == undefined) { return false }

    const passwordMatch = await bcrypt.compare(password, hash);
    return passwordMatch;
}

async function sign_in(username, password, organization) {
    console.log(fs.readFileSync(hashes))
    console.log(JSON.parse(fs.readFileSync(hashes)))
    console.log(organization + '/' + username)
    console.log(JSON.parse(fs.readFileSync(hashes))[organization + '/' + username])
    if (JSON.parse(fs.readFileSync(hashes))[organization + '/' + username] == undefined) { return false }

    const passwordMatch = await compare_password(password, JSON.parse(fs.readFileSync(hashes))[organization + '/' + username], organization, username);
    console.log(passwordMatch)
    return passwordMatch;
}

function update() {
    data = JSON.parse(fs.readFileSync(fires))
}