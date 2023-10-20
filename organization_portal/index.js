const urlParams = new URLSearchParams(window.location.search);
const dom_parser = new DOMParser();
const err_invalid = dom_parser.parseFromString('<div class="error">Incorrect Key.</div>', 'text/html').body.firstChild
const err_select = dom_parser.parseFromString('<div class="error">Select a user first.</div>', 'text/html').body.firstChild
const err_empty = dom_parser.parseFromString('<div class="error">Username and Password can not be empty.</div>', 'text/html').body.firstChild
let sessionID, organization
let selectedButton = null;

window.addEventListener('DOMContentLoaded', (event) => {
    socket = new WebSocket(`ws://localhost:8080`);

    socket.onopen = function (event) {
        console.log(`[WS Open] Successfully connected to server.`);
        if (urlParams.get('key') != undefined) {
            console.log(document.getElementById('sign_in'))
            document.getElementById('sign_in').classList.add('hidden')
            socket.send(JSON.stringify({ 'client': "org-portal", 'type': "sign-in", 'data': urlParams.get('key')}))
        }
    }

    socket.onerror = function (event) {
        console.log(`[WS Error] WebSocket encountered an error. Code: ${event.code}. Reason: ${event.reason}`);
    }

    socket.onmessage = function (event) {
        msg = JSON.parse(event.data);
        if (msg['type'] == 'sign_in-success') {
            document.getElementById('sign_in').remove()
            document.getElementById('main').classList.remove('hidden')
            sessionID = msg['data']['session']
            organization = msg['data']['organization']
            console.log(msg['data']['users'])
            msg['data']['users'].forEach((i) => {
                console.log(i)
                const user = document.createElement('button')
                user.classList.add('user')
                user.innerText = i.replace(organization + '/', '')
                user.addEventListener('click', () => {
                    if (selectedButton !== user) {
                        if (selectedButton) {
                            selectedButton.classList.remove('selected');
                        } else {
                            document.getElementById('newUsername').disabled = false
                            document.getElementById('newPassword').disabled = false
                        }

                        selectedButton = user;

                        document.getElementById('newUsername').value = user.innerText

                        user.classList.add('selected');
                    }
                });
                document.getElementById('users').appendChild(user)
            })
        } else if (msg['type'] == 'sign_in-fail') {
            console.log('hello')
            document.getElementById('sign_in').classList.remove('hidden')
            console.log(document.getElementById('sign_in'))
            document.getElementById('sign_in').insertBefore(err_invalid, document.getElementById('sign_in').firstChild)
        }
    }

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log(`[WS Close] Connection Closed Cleanly. Code: ${event.code}. Reason: ${event.reason}`);
        } else {
            console.log(`[WS Close] Connection Lost.`);
        }
    }
})

function create() {
    let newURL = new URL("http://localhost:3000/organization_portal/create_acc?key=")
    newURL += urlParams.get('key')
    window.location = newURL
}

function delete_acc() {
    if (selectedButton == null) {
        document.getElementById('account-controls').appendChild(err_select)
    } else {
        socket.send(JSON.stringify({'client': 'org-portal', 'organization': msg['data']['organization'], 'type': 'acc-delete', 'data': selectedButton.innerText}))
    }
    window.location.reload()
}

function edit() {
    if (selectedButton == null) {
        document.getElementById('account-controls').appendChild(err_select)
    } else if (document.getElementById('newUsername') != '' & document.getElementById('newPassword') != '') {
        socket.send(JSON.stringify({'client': 'org-portal', 'organization': msg['data']['organization'], 'type': 'acc-edit', 'data': {'username': selectedButton.innerText, 'newUsername': document.getElementById('newUsername').value, 'newPassword': document.getElementById('newPassword').value}}))
    } else {
        document.getElementById('account-controls').appendChild(err_empty)
    }
}