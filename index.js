const projectId = 'firesignal';
const apiUrl = `https://datastore.googleapis.com/v1/projects/${projectId}:runQuery`
let map, userPos, currPos

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {zoom: 8})

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            userPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
            map.setCenter(userPos)
            map.setZoom(15)
        });
    }

    let socket = new WebSocket("ws://localhost:8080")
    map.addListener('click', (mapsMouseEvent) => {
        const position = mapsMouseEvent.latLng.toJSON()
        currPos = JSON.stringify(position)
        document.getElementById('position').innerText = position['lat'] + ', ' + position['lng']
        document.getElementById('add-fire').classList.remove('hidden')
    })

    document.getElementById('add-fire').addEventListener('click', (event) => {
        socket.send(currPos)
    })

    socket.onopen = function(event) {
        console.log('[WS Open] Successfully connected to server.')
    }

    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`[WS Close] Connection Closed Cleanly. Code: ${event.code}. Reason: ${event.reason}`)
        } else {
            console.log(`[WS Close] Connection Lost.`)
        }
    }

    socket.onerror = function(event) {
        console.log(`[WS Error] WebSocket encountered an error. Code: ${event.code}. Reason: ${event.reason}`)
    }

    socket.onmessage = function(event) {
        console.log(`[WS Message] Message Received from server: ${event.data}`)
    }
}