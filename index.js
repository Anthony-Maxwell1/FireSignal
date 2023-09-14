const projectId = 'firesignal';
const apiUrl = `https://datastore.googleapis.com/v1/projects/${projectId}:runQuery`
let map, userPos, currPos
let lastMarker = null
const markers = []

function initMap() {
    let socket = new WebSocket("ws://localhost:8080")

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
        document.getElementById('loading').innerHTML = "An Error has occured."
    }

    map = new google.maps.Map(document.getElementById('map'), {zoom: 8})

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            userPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
            map.setCenter(userPos)
            map.setZoom(15)
        });
    }

    map.addListener('click', (mapsMouseEvent) => {
        const position = mapsMouseEvent.latLng.toJSON()
        if (lastMarker) {
            lastMarker.setMap(null)
        }
        currPos = JSON.stringify(position)
        document.getElementById('add-fire').classList.remove('hidden')
        const svgMarker = {
            path: "M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
            fillColor: "blue",
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 30,
            scale: 2,
            anchor: new google.maps.Point(0, 20),
        };
        const marker = new google.maps.Marker({
            position: position,
            title: "Report Fire Here",
            icon: svgMarker
        });
        console.log(marker)
        marker.setMap(map)
        lastMarker = marker
    })

    const marker = new google.maps.Marker({
        position: userPos,
        title: "Fire"
    });
    marker.setMap(map)

    socket.onmessage = function(event) {
        msg = JSON.parse(event.data)
        if (msg['type'] == 'fires') {
            for (const e in msg['data']) {
                const lat = JSON.parse(msg['data'][e])['lat'];
                const lng = JSON.parse(msg['data'][e])['lng'];

                const loc = new google.maps.LatLng(lat, lng);

                const marker = new google.maps.Marker({
                    position: loc,
                    title: "Fire",
                    icon: 'fire.png'
                });

                marker.setMap(map);

                markers.push(marker);
            }
        } else if (msg['type'] == 'msg') {
            console.log(`[WS Message] Message Received from server: ${event.data['data']}`)
        }
    }

    document.getElementById('add-fire').addEventListener('click', (event) => {
        socket.send(JSON.stringify(currPos))
        document.getElementById('reported').innerText = 'Reported.'
    })

    document.getElementById('loading').remove()
    document.getElementById('main').classList.remove('hidden')
}