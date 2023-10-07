const urlParams = new URLSearchParams(window.location.search);
const dom_parser = new DOMParser();
const err_empty = dom_parser.parseFromString('<div class="error">Username and Password cannot be blank.</div>', 'text/html').body.firstChild
const err_used = dom_parser.parseFromString('<div class="error">That username is used.</div>', 'text/html').body.firstChild

function containsObject(obj, list) {
    var x;
    for (x in list) {
        if (list.hasOwnProperty(x) && list[x] === obj) {
            return true;
        }
    }

    return false;
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('create_acc-form').addEventListener('submit', function (e) {
        e.preventDefault();
        
        var form = e.target;
        
        var formData = new FormData(form);
        
        var urlSearchParams = new URLSearchParams(window.location.search);
        
        formData.forEach(function (value, key) {
            urlSearchParams.delete(key);
        });
        
        var updatedParams = '?' + urlSearchParams.toString();
        
        formData.forEach(function (value, key) {
            updatedParams += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(value);
        });
        
        history.pushState(null, null, window.location.pathname + updatedParams);
    });
    
    socket = new WebSocket(`ws://localhost:8080`);

    socket.onopen = function (event) {
        console.log(`[WS Open] Successfully connected to server.`);
        socket.send(JSON.stringify({ 'client': "org-portal", 'type': "sign-in", 'data': urlParams.get('key')}))
    }

    socket.onerror = function (event) {
        console.log(`[WS Error] WebSocket encountered an error. Code: ${event.code}. Reason: ${event.reason}`);
    }

    socket.onmessage = function (event) {
        msg = JSON.parse(event.data);
        if (msg['type'] == 'sign_in-success') {
            if (urlParams.get('username') != undefined) {
                if (urlParams.get('username') == '' || urlParams.get('password') == '' || urlParams.get('username') == null || urlParams.get('password') == null) {
                    document.body.insertBefore(err_empty, document.body.firstChild)
                } else {
                    console.log(msg['data']['users'])
                    console.log(containsObject(msg['data']['organization'] + '/' + urlParams.get('username'), msg['data']['users']))
                    if (containsObject(msg['data']['organization'] + '/' + urlParams.get('username'), msg['data']['users'])) {
                        document.body.insertBefore(err_used, document.body.firstChild)
                    } else {
                        console.log('hi')
                        socket.send(JSON.stringify({'client': 'org-portal', 'organization': msg['data']['organization'], 'type': 'acc-create', 'data': {'username': urlParams.get('username'), 'password': urlParams.get('password')}}))
                    }
                }
            }
        } else if (msg['type'] == 'sign_in-fail') {
            console.log("Incorrect Key! Do not tamper with the URL.")
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