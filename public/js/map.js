const mapToken = document.body.dataset.mapToken;

const services = JSON.parse(
    document.body.dataset.services || "[]"
);

// ✅ SAFE DEFAULT LOCATION
const DEFAULT_LOCATION = [

    parseFloat(
        document.body.dataset.defaultLng
    ) || 72.8777,

    parseFloat(
        document.body.dataset.defaultLat
    ) || 19.076

];

// ---------------- GLOBALS ----------------
let map;

let userLocation = DEFAULT_LOCATION;

const markers = [];

// ---------------- CHECK TOKEN ----------------
if (!mapToken) {

    console.error("❌ Map token missing");

} else {

    mapboxgl.accessToken = mapToken;

    // ---------------- MAP INIT ----------------
    map = new mapboxgl.Map({

        container: "map",

        style: "mapbox://styles/mapbox/streets-v11",

        center: DEFAULT_LOCATION,

        zoom: 10

    });

    // ---------------- CONTROLS ----------------
    map.addControl(
        new mapboxgl.NavigationControl()
    );

    map.addControl(
        new mapboxgl.GeolocateControl({

            positionOptions: {
                enableHighAccuracy: true
            },

            trackUserLocation: true

        })
    );

    console.log("✅ Map loaded");

    // ---------------- SERVICE MARKERS ----------------
    services.forEach(service => {

        // ✅ SAFE COORDINATE CHECK
        if (
            !service.coordinates ||
            !Array.isArray(service.coordinates) ||
            service.coordinates.length < 2 ||
            isNaN(service.coordinates[0]) ||
            isNaN(service.coordinates[1])
        ) {
            return;
        }

        const popup = new mapboxgl.Popup().setHTML(`

        <div class="service-card">

            <h3>${service.title}</h3>

            <p>₹ ${service.price}</p>

            <p>⭐ ${service.rating}</p>

            <p id="distance-${service._id}">
               📍 Calculating distance...
            </p>

           <p id="time-${service._id}">
               ⏱ Calculating ETA...
           </p>

       </div>

       `);

        const marker = new mapboxgl.Marker({

            color:
                Number(service.rating) >= 4.5
                    ? "gold"
                    : "red"

        })

        .setLngLat(service.coordinates)

        .setPopup(popup)

        .addTo(map);

        markers.push({
            marker,
            service
        });

    });

    // ---------------- DISTANCE FUNCTION ----------------
    function getDistance(a, b) {

        const R = 6371;

        const dLat =
            (b[1] - a[1]) * Math.PI / 180;

        const dLon =
            (b[0] - a[0]) * Math.PI / 180;

        const lat1 =
            a[1] * Math.PI / 180;

        const lat2 =
            b[1] * Math.PI / 180;

        const x =

            Math.sin(dLat / 2) ** 2 +

            Math.sin(dLon / 2) ** 2 *

            Math.cos(lat1) *

            Math.cos(lat2);

        return R * 2 *

            Math.atan2(
                Math.sqrt(x),
                Math.sqrt(1 - x)
            );
    }

    // ---------------- HIGHLIGHT NEAREST ----------------
    function highlightNearest() {

        let nearest = null;

        let minDistance = Infinity;

        markers.forEach(item => {

            const dist = getDistance(
                userLocation,
                item.service.coordinates
            );

            if (dist < minDistance) {

                minDistance = dist;

                nearest = item;
            }
            // ---------------- ETA ----------------

        // AVG SPEED = 40 km/h
        const eta = (dist / 40) * 60;

        // ---------------- POPUP UPDATE ----------------

        const distanceEl = document.getElementById(
            `distance-${item.service._id}`
        );

        const timeEl = document.getElementById(
            `time-${item.service._id}`
             );

        if (distanceEl) {

            distanceEl.innerHTML =
                `📍 ${dist.toFixed(2)} km away`;
        }

        if (timeEl) {

            timeEl.innerHTML =
                `⏱ ${eta.toFixed(0)} mins`;
        }

         // ---------------- CARD UPDATE ----------------

        const cardDistance = document.getElementById(
            `card-distance-${item.service._id}`
        );

        const cardTime = document.getElementById(
            `card-time-${item.service._id}`
        );

        if (cardDistance) {

            cardDistance.innerHTML =
                `📍 ${dist.toFixed(2)} km away`;
        }

        if (cardTime) {

            cardTime.innerHTML =
                `⏱ ${eta.toFixed(0)} mins`;
        }

       });

        if (nearest) {

            map.flyTo({

                center:
                    nearest.service.coordinates,

                zoom: 14

            });

            nearest.marker.togglePopup();

            const routeInfo =
                document.getElementById(
                    "route-info"
                );

            if (routeInfo) {

                routeInfo.innerHTML = `

                    🚀 Nearest Service:
                    <b>${nearest.service.title}</b>

                    <br>

                    📍 ${minDistance.toFixed(2)} km away

                `;
            }
        }
    }

    // ---------------- LIVE LOCATION ----------------
    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(

            position => {

                userLocation = [

                    position.coords.longitude,

                    position.coords.latitude

                ];

                // USER MARKER
                new mapboxgl.Marker({

                    color: "blue"

                })

                .setLngLat(userLocation)

                .setPopup(

                    new mapboxgl.Popup()
                    .setHTML(
                        "<h3>📍 You are here</h3>"
                    )

                )

                .addTo(map);

                // CENTER MAP
                map.flyTo({

                    center: userLocation,

                    zoom: 13

                });

                // FIND NEAREST
                highlightNearest();

            },

            error => {

                console.log(
                    "❌ Location blocked"
                );

                console.log(error);

            }

        );
    }

    // ---------------- ROUTE FUNCTION ----------------
    window.showRoute = function(destination) {

        // SAFE CHECK
        if (
            !destination ||
            destination.length < 2
        ) {
            return;
        }

        const url =

            `https://api.mapbox.com/directions/v5/mapbox/driving/` +

            `${userLocation[0]},${userLocation[1]};` +

            `${destination[0]},${destination[1]}` +

            `?geometries=geojson&access_token=${mapToken}`;

        fetch(url)

            .then(res => res.json())

            .then(data => {

                if (
                    !data.routes ||
                    !data.routes.length
                ) {
                    return;
                }

                const route =
                    data.routes[0];

                const distance =

                    (
                        route.distance / 1000
                    ).toFixed(2);

                const duration =

                    (
                        route.duration / 60
                    ).toFixed(1);

                // REMOVE OLD ROUTE
                if (map.getLayer("route")) {

                    map.removeLayer("route");
                }

                if (map.getSource("route")) {

                    map.removeSource("route");
                }

                // ADD ROUTE
                map.addSource("route", {

                    type: "geojson",

                    data: {

                        type: "Feature",

                        geometry:
                            route.geometry
                    }
                });

                map.addLayer({

                    id: "route",

                    type: "line",

                    source: "route",

                    paint: {

                        "line-color": "#4f46e5",

                        "line-width": 5
                    }

                });

                // ROUTE INFO
                const routeInfo =
                    document.getElementById(
                        "route-info"
                    );

                if (routeInfo) {

                    routeInfo.innerHTML = `

                        📍 Distance:
                        <b>${distance} km</b>

                        <br>

                        ⏱ Time:
                        <b>${duration} mins</b>

                    `;
                }

            })

            .catch(err => {

                console.log(
                    "❌ Route error",
                    err
                );

            });
    };
}

// ---------------- PRICE RANGE ----------------
const range =

    document.querySelector(
        "input[name='maxPrice']"
    );

const priceOut =
    document.getElementById("priceOut");

if (range && priceOut) {

    range.addEventListener(

        "input",

        (e) => {

            priceOut.innerText =
                e.target.value;
        }

    );
}