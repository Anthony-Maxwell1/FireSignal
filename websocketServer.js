const websocket = require('ws');
const wss = new websocket.Server({ port: 8080 });
const fs = require('fs');
let currIndex = 0
let fires = 'fires.json';
let data = JSON.parse(fs.readFileSync(fires))

wss.on('connection', (ws) => {
    console.log('A client connected.');
    ws.send()

    ws.on('message', (message) => {
        if (typeof message === 'string') {
            console.log('Received message:', message);
        } else if (message instanceof Buffer) {
            let decodedMessage = message.toString('utf-8');
            JSON.parse(decodedMessage)
            currIndex += 1
            data[currIndex.toString()] = decodedMessage
            fs.writeFileSync(fires, JSON.stringify(data))
            console.log('Received message: ', decodedMessage);
        } else {
            console.log('Received unknown message type');
            console.log(message);
        }
    });

    ws.on('close', () => {
        console.log('A client disconnected.');
    });
});
