const websocket = require('ws');
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');
const saltRounds = 10;
const wss = new websocket.Server({ port: 8080 });
const fs = require('fs');
let currIndex = 0;
let fires = 'fires.json';
let hashes = 'logins.json';
let data = JSON.parse(fs.readFileSync(fires));
let organizations = []
for (var i in JSON.parse(fs.readFileSync('organizations.json'))) {
    organizations.push(i)
}
let accounts = JSON.parse(fs.readFileSync('logins.json'))
let FFSessions = {};
let PSessions = {};

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
            console.log(message)
            const decodedMessage = JSON.parse(message);

            // Check if the parsed message is an object
            if (typeof decodedMessage === 'object' && decodedMessage !== null) {
                if (decodedMessage['type'] == 'report') {
                    currIndex += 1;
                    if (decodedMessage['client'] == 'firefighter') {
                        if (FFSessions[ws] != undefined) {
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
                        res = await sign_in(decodedMessage['data']['username'], decodedMessage['data']['password'], decodedMessage['data']['organization'])
                        if (res == true) {
                            let session = uuidv4()
                            FFSessions[ws] = session
                            ws.send(JSON.stringify({ 'type': 'sign_in-success', 'data': session }));
                        } else if (res == 'deleted') {
                            ws.send(JSON.stringify({ 'type': 'account_deleted' }))
                        } else {
                            ws.send(JSON.stringify({ 'type': 'sign_in-fail' }));
                        }
                    } else if (FFSessions[ws] != undefined) {
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
                } else if (decodedMessage['client'] == 'org-portal') {
                    if (decodedMessage['type'] == 'sign-in') {
                        console.log('abcdefghijklmnopqrstuvwxyz')
                        let res = await org_sign_in(decodedMessage['data'])
                        console.log(res[0])
                        console.log(res[1])
                        if (res[0] == true) {
                            let session = uuidv4()
                            PSessions[ws] = session
                            let users = get_users(res[1])
                            ws.send(JSON.stringify({ 'type': 'sign_in-success', 'data': { 'session': session, 'organization': res[1], 'users': users } }));
                        } else {
                            ws.send(JSON.stringify({ 'type': 'sign_in-fail' }));
                        }
                    } else if (PSessions[ws] != undefined) {
                        if (decodedMessage['type'] == 'acc-delete') {
                            delete_account(decodedMessage['organization'], decodedMessage['data']['username'])
                        } else if (decodedMessage['type'] == 'acc-create') {
                            create_account(decodedMessage['organization'], decodedMessage['data']['username'], decodedMessage['data']['password'])
                        } else if (decodedMessage['type'] == 'acc-edit') {
                            delete_account(decodedMessage['organization'], decodedMessage['data']['username'])
                            create_account(decodedMessage['organization'], decodedMessage['data']['newUsername'], decodedMessage['data']['newPassword'])
                        } else if (decodedMessage['type'] == 'fetchInfo') {
                            ws.send(JSON.stringify({'type': 'fetched-info', 'data': accounts[decodedMessage['data']]}))
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
    if (JSON.parse(fs.readFileSync(hashes))[organization + '/' + username] == 'deleted') { return 'deleted' }

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

function get_users(organization) {
    let org_accounts = []
    for (i in accounts) {
        if (i.split('/')[0] == organization) {
            org_accounts.push(i)
        }
    }
    return org_accounts
}

async function org_sign_in(key) {
    for (const value of organizations) {
        console.log(key);
        console.log(value);
        const res = await bcrypt.compare(key, value['key']);
        console.log(res);
        if (res === true) {
            return [true, value['value']];
        }
    }
    return [false, null];
}

function update() {
    data = JSON.parse(fs.readFileSync(fires))
    accounts = JSON.parse(fs.readFileSync('logins.json'))
    organizations = JSON.parse(fs.readFileSync('organizations.json'))
}

function delete_account(organization, account) {
    update()
    username = organization + '/' + account
    accounts[username] = 'deleted'
    fs.writeFileSync('logins.json', accounts)
}

async function create_account(organization, username, password) {
    update()
    const username_ = organization + '/' + username
    accounts[username_] = await encrypt_password(password)
    fs.writeFileSync('logins.json', JSON.stringify(accounts))
}