const addFire = `<div id="reported" class="reported"></div>
<button id="add-fire" class="add-fire" onclick="reportfire()">Report Fire</button>`
const palettes = [{'--text': '#54b6eb', '--background': '#f5f6ff', '--primary': '#051abd', '--secondary': '#c8cffe', '--accent': '#0722f2'},
                  {'--text': '#140612', '--background': '#f7e4f4', '--primary': '#f4a4eb', '--secondary': '#efb1a9', '--accent': '#ab219b'},
                  {'--text': '#0f657f', '--background': '#d5f3fc', '--primary': '#12b2de', '--secondary': '#b5e5f2', '--accent': '#3f8497'},
                  {'--text': '#0a2a23', '--background': '#71ddba', '--primary': '#04d22a', '--secondary': '#a5fde1', '--accent': '#2e843f'}]
let map, userPos, currPos, lastView, lastMarker;
let socket;
const markers = [];
curr_interacting = false

function distance_between(pos1, pos2) {
    let lat1 = pos1['lat'];
    let lat2 = pos2['lat'];
    let lng1 = pos1['lng'];
    let lng2 = pos2['lng'];
    if ((lat1 == lat2) && (lng1 == lng2)) {
        return 0;
    } else {
        let radlat1 = Math.PI * lat1 / 180;
        let radlat2 = Math.PI * lat2 / 180;
        let theta = lng1 - lng2;
        let radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;
        return dist;
    }
}

async function initMap() {
    try {
        const svgMarker = {
            path: "M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z",
            fillColor: "red",
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 0.05,
            anchor: new google.maps.Point(0, 5),
        };
        map = new google.maps.Map(document.getElementById(`map`), { zoom: 8 });

        // Promisify geolocation
        function getCurrentPosition() {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
        }

        try {
            // Get user's position
            const position = await getCurrentPosition();
            userPos = { 'lat': position.coords.latitude, 'lng': position.coords.longitude };
            console.log(userPos);
            const mapsUserPos = new google.maps.LatLng(userPos['lat'], userPos['lng']);
            map.setCenter(mapsUserPos);
            map.setZoom(15);
            console.log(map);
            console.log(socket);

            map.addListener(`click`, (mapsMouseEvent) => {
                const position = mapsMouseEvent.latLng.toJSON();
                if (lastMarker != undefined) {
                    lastMarker.setMap(null);
                }
                currPos = JSON.stringify(position);
                const marker = new google.maps.Marker({
                    position: position,
                    title: `Report Fire Here`,
                    icon: svgMarker
                });
                infowindow = new google.maps.InfoWindow();
                infowindow.setContent(addFire);
                infowindow.open(map, marker);
                marker.setMap(map);
                lastMarker = marker;
            });

            const marker = new google.maps.Marker({
                position: userPos,
                title: `Fire`
            });
            marker.setMap(map);
        } catch (error) {
            console.error(error);
        }

        socket = new WebSocket(`ws://localhost:8080`);

        socket.onopen = function (event) {
            console.log(`[WS Open] Successfully connected to server.`);
        }

        socket.onclose = function (event) {
            if (event.wasClean) {
                console.log(`[WS Close] Connection Closed Cleanly. Code: ${event.code}. Reason: ${event.reason}`);
            } else {
                console.log(`[WS Close] Connection Lost.`);
            }
        }

        socket.onerror = function (event) {
            console.log(`[WS Error] WebSocket encountered an error. Code: ${event.code}. Reason: ${event.reason}`);
        }

        socket.onmessage = function (event) {
            console.log(event);
            console.log(event.data);
            console.log(JSON.parse(event.data));
            console.log(JSON.parse(event.data)['type']);
            msg = JSON.parse(event.data);
            if (msg[`type`] == `fires`) {
                console.log('hi');
                for (const e in msg[`data`]) {
                    const lat = JSON.parse(msg[`data`][e])[`lat`];
                    const lng = JSON.parse(msg[`data`][e])[`lng`];

                    const loc = new google.maps.LatLng(lat, lng);
                    console.log(userPos);
                    let distance = distance_between(userPos, { 'lat': lat, 'lng': lng });
                    console.log(distance);
                    const xhr = new XMLHttpRequest();
                    xhr.open(`GET`, `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBu6ozOeYmoHhXBZ6_ABKbs9tskz5sWE1c`);
                    xhr.send();
                    xhr.responseType = `json`;
                    xhr.onload = () => {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            makeMarker(loc, xhr.response);
                        } else {
                            console.log(`Error: ${xhr.status}`);
                        }
                    };
                }
            } else if (msg[`type`] == `msg`) {
                console.log(`[WS Message] Message Received from server: ${msg[`data`]}`);
            }
        }
        document.getElementById(`loading`).remove();
        document.getElementById(`main`).classList.remove(`hidden`);
        document.getElementById(`view-options`).classList.remove(`hidden`);
    } catch {
        document.getElementById(`loading`).innerHTML = `<img src="error.png">
        An Error has occurred. Check Developer Tools for more information.`;
    }
}

function makeMarker(loc, address) {
    const fire = document.createElement(`div`);
    console.log(address);
    fire.classList.add(`fire`);
    fire.innerText = address['results'][0]['formatted_address'];

    const marker = new google.maps.Marker({
        position: loc,
        title: `Fire`,
        icon: `fire.png`
    });

    marker.setMap(map);
    markers.push(marker);
    document.getElementById('list').appendChild(fire)
}

function reportfire() {
    socket.send(JSON.stringify({'type': 'report', 'data': currPos}));
    document.getElementById(`reported`).innerText = `Reported.`;
}

function mapView() {
    document.getElementById('list').classList.add('hidden')
    document.getElementById('list-title').classList.add('hidden')
    document.getElementById('main').classList.remove('hidden')
}

function listView() {
    document.getElementById('list-title').classList.remove('hidden')
    document.getElementById('list').classList.remove('hidden')
    document.getElementById('main').classList.add('hidden')
}

function toggleOptions() {
    var dropdownContent = document.getElementById("dropdown-content");
    if (dropdownContent.classList.contains("active")) {
        dropdownContent.classList.remove("active");
        document.removeEventListener("click", closeDropdownOnUnfocus);
    } else {
        dropdownContent.classList.add("active");
        document.addEventListener("click", closeDropdownOnUnfocus);
    }
}

function closeDropdownOnUnfocus(event) {
    var dropdownContent = document.getElementById("dropdown-content");
    var optionsButton = document.getElementById("options");
    if (!dropdownContent.contains(event.target) && event.target !== optionsButton) {
        dropdownContent.classList.remove("active");
        document.removeEventListener("click", closeDropdownOnUnfocus);
    }
}

function swapPalette(paletteNo) {
    for (var_ in palettes[paletteNo]) {
        document.documentElement.style.setProperty(var_, palettes[paletteNo][var_])
    }
}

const animateTrailer = (e, interacting) => {
    const x = e.clientX - trailer.offsetWidth / 2,
          y = e.clientY - trailer.offsetHeight / 2;
    
    const keyframes = {
        transform: `translate(${x}px, ${y}px) scale(${interacting ? 8 : 1})`
    }
    
    trailer.animate(keyframes, { 
        duration: 800, 
        fill: "forwards" 
    });
}

const getTrailerClass = type => {
    switch(type) {
        case 'listView':
            return "fa-solid fa-rectangle-list"
        case 'mapView':
            return "fa-solid fa-map"
        case 'options':
            return "fa-solid fa-list-ul"
        case 'colour-palette':
            return "fa-solid fa-palette"
        default:
            return "fa-solid fa-link"; 
    }
}

window.addEventListener("DOMContentLoaded", (event) => {
    const trailer = document.getElementById("trailer")
    window.onmousemove = e => {
        const interactable = e.target.closest(".interactable"),
              interacting = interactable !== null
        
        const icon = document.getElementById("trailer-icon")
        
        animateTrailer(e, interacting)
        
        trailer.dataset.type = interacting ? interactable.dataset.type : ""
        
        if (interacting) {
            icon.className = getTrailerClass(interactable.dataset.type)
        }
    }
})