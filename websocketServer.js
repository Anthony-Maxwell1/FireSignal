const websocket = require('ws');
const wss = new websocket.Server({ port: 8080 });
const fs = require('fs');
let currIndex = 0;
let fires = 'fires.json';
let data = JSON.parse(fs.readFileSync(fires));

wss.on('connection', (ws) => {
    console.log('A client connected.');
    ws.send(JSON.stringify({ 'type': 'fires', 'data': data }));

    ws.on('message', (message) => {
        console.log('Received message:', message);

        try {
            // Attempt to parse the message as JSON
            const decodedMessage = JSON.parse(message);

            // Check if the parsed message is an object
            if (typeof decodedMessage === 'object' && decodedMessage !== null) {
                currIndex += 1;
                data[currIndex.toString()] = decodedMessage;
                fs.writeFileSync(fires, JSON.stringify(data, null, 2), 'utf-8');
                console.log('Received valid JSON message:', decodedMessage);
                ws.send(JSON.stringify({ 'type': 'msg', 'data': 'Reported Fire.' }));
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

