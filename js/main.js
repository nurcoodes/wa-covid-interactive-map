const path = window.location.pathname.toLowerCase();
const isMap1 = path.includes("map1");
const isMap2 = path.includes("map2");

function runWhenStyleReady(map, callback) {
    if (map.loaded() || map.isStyleLoaded()) {
        callback();
    } else {
        map.once("load", callback);
    }
}

function createBaseMap(styleId) {
    const styles = {
        light: {
            version: 8,
            sources: {
                "carto-light": {
                    type: "raster",
                    tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
                    tileSize: 256,
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }
            },
            layers: [{ id: "carto-light-layer", type: "raster", source: "carto-light" }]
        },
        dark: {
            version: 8,
            sources: {
                "carto-dark": {
                    type: "raster",
                    tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
                    tileSize: 256,
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }
            },
            layers: [{ id: "carto-dark-layer", type: "raster", source: "carto-dark" }]
        }
    };

    const map = new maplibregl.Map({
        container: "map",
        style: styles[styleId],
        center: [-98.8, 38.8],
        zoom: 3.25,
        minZoom: 2.8
    });

    map.getCanvas().style.cursor = "default";

    try {
        map.setProjection({ name: "albers" });
    } catch (error) {
        // Projection not available in some builds.
    }

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    return map;
}

function buildRatesLegend() {
    const rateBreaks = [25, 50, 100, 150, 225];
    const rateColors = ["#f1eef6", "#d0d1e6", "#a6bddb", "#67a9cf", "#1c9099", "#016c59"];
    const rateLabels = [
        `< ${rateBreaks[0]}`,
        `${rateBreaks[0]} - ${rateBreaks[1]}`,
        `${rateBreaks[1]} - ${rateBreaks[2]}`,
        `${rateBreaks[2]} - ${rateBreaks[3]}`,
        `${rateBreaks[3]} - ${rateBreaks[4]}`,
        `>= ${rateBreaks[4]}`
    ];

    const legend = document.getElementById("legend");
    let legendHtml = '<p class="legend-title">Cases per 1,000 residents</p>';
    for (let i = 0; i < rateLabels.length; i += 1) {
        legendHtml += `<div class="legend-row"><span class="legend-swatch" style="background:${rateColors[i]}"></span>${rateLabels[i]}</div>`;
    }
    legendHtml += '<p class="legend-source">Source: The New York Times (COVID-19), ACS 2018 5-year estimates, U.S. Census boundaries.<br>Map by Nur (GEOG 450).</p>';
    legend.innerHTML = legendHtml;

    return { rateBreaks, rateColors };
}

async function initMap1() {
    const map = createBaseMap("light");
    const { rateBreaks, rateColors } = buildRatesLegend();

    runWhenStyleReady(map, async () => {
        try {
            const response = await fetch("assets/us-covid-2020-rates.geojson");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const covidRateData = await response.json();

            map.addSource("covid-rates", { type: "geojson", data: covidRateData });

            map.addLayer({
                id: "covid-rates-fill",
                type: "fill",
                source: "covid-rates",
                paint: {
                    "fill-color": [
                        "step",
                        ["to-number", ["get", "rates"]],
                        rateColors[0],
                        rateBreaks[0], rateColors[1],
                        rateBreaks[1], rateColors[2],
                        rateBreaks[2], rateColors[3],
                        rateBreaks[3], rateColors[4],
                        rateBreaks[4], rateColors[5]
                    ],
                    "fill-opacity": 0.78
                }
            });

            map.addLayer({
                id: "covid-rates-outline",
                type: "line",
                source: "covid-rates",
                paint: {
                    "line-color": "#ffffff",
                    "line-width": 0.25,
                    "line-opacity": 0.55
                }
            });

            map.on("click", "covid-rates-fill", (event) => {
                const p = event.features[0].properties;
                const html = [
                    `<strong>${p.county}, ${p.state}</strong>`,
                    `Cases: ${Number(p.cases).toLocaleString()}`,
                    `Deaths: ${Number(p.deaths).toLocaleString()}`,
                    `Rate: ${Number(p.rates).toFixed(2)} per 1,000`,
                    `Population (2018): ${Number(p.pop18).toLocaleString()}`
                ].join("<br>");

                new maplibregl.Popup().setLngLat(event.lngLat).setHTML(html).addTo(map);
            });

            map.on("mousemove", ({ point }) => {
                const county = map.queryRenderedFeatures(point, { layers: ["covid-rates-fill"] });
                document.getElementById("text-description").innerHTML = county.length
                    ? `<h3>${county[0].properties.county}, ${county[0].properties.state}</h3><p><strong>${Number(county[0].properties.rates).toFixed(2)}</strong> cases per 1,000 residents</p>`
                    : "<p>Hover over a county!</p>";
            });

            map.on("mouseenter", "covid-rates-fill", () => {
                map.getCanvas().style.cursor = "pointer";
            });

            map.on("mouseleave", "covid-rates-fill", () => {
                map.getCanvas().style.cursor = "";
            });
        } catch (error) {
            const el = document.getElementById("text-description");
            if (el) el.innerHTML = `<p>Failed to load map data: ${error.message}</p>`;
            console.error("Map 1 load error:", error);
        }
    });
}

function buildCasesLegend(caseBreaks, caseRadii, caseColors) {
    const caseLabels = [
        `< ${caseBreaks[0].toLocaleString()}`,
        `${caseBreaks[0].toLocaleString()} - ${caseBreaks[1].toLocaleString()}`,
        `${caseBreaks[1].toLocaleString()} - ${caseBreaks[2].toLocaleString()}`,
        `${caseBreaks[2].toLocaleString()} - ${caseBreaks[3].toLocaleString()}`,
        `>= ${caseBreaks[3].toLocaleString()}`
    ];

    const legend = document.getElementById("legend");
    let legendHtml = '<p class="legend-title">Total reported cases</p>';
    for (let i = 0; i < caseLabels.length; i += 1) {
        const dotSize = caseRadii[i] * 2;
        legendHtml += `<div class="legend-row"><span class="legend-dot" style="width:${dotSize}px;height:${dotSize}px;background:${caseColors[i]}"></span>${caseLabels[i]}</div>`;
    }
    legendHtml += '<p class="legend-source">Source: The New York Times (COVID-19), U.S. Census county boundaries.<br>Map by Nur (GEOG 450).</p>';
    legend.innerHTML = legendHtml;
}

async function initMap2() {
    const map = createBaseMap("light");
    const caseBreaks = [1000, 10000, 100000, 500000];
    const caseRadii = [4, 8, 13, 19, 26];
    const caseColors = ["#e0ecf4", "#9ebcda", "#8c96c6", "#88419d", "#4d004b"];

    buildCasesLegend(caseBreaks, caseRadii, caseColors);

    runWhenStyleReady(map, async () => {
        try {
            const response = await fetch("assets/us-covid-2020-counts.geojson");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const pointsData = await response.json();

            map.addSource("covid-counts-points", { type: "geojson", data: pointsData });

            map.addLayer({
                id: "covid-counts-point",
                type: "circle",
                source: "covid-counts-points",
                paint: {
                    "circle-radius": [
                        "step",
                        ["to-number", ["get", "cases"]],
                        caseRadii[0],
                        caseBreaks[0], caseRadii[1],
                        caseBreaks[1], caseRadii[2],
                        caseBreaks[2], caseRadii[3],
                        caseBreaks[3], caseRadii[4]
                    ],
                    "circle-color": [
                        "step",
                        ["to-number", ["get", "cases"]],
                        caseColors[0],
                        caseBreaks[0], caseColors[1],
                        caseBreaks[1], caseColors[2],
                        caseBreaks[2], caseColors[3],
                        caseBreaks[3], caseColors[4]
                    ],
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 0.8,
                    "circle-opacity": 0.7
                }
            });

            map.on("click", "covid-counts-point", (event) => {
                const p = event.features[0].properties;
                const html = [
                    `<strong>${p.county}, ${p.state}</strong>`,
                    `Cases: ${Number(p.cases).toLocaleString()}`,
                    `Deaths: ${Number(p.deaths).toLocaleString()}`,
                    `FIPS: ${p.fips}`
                ].join("<br>");

                new maplibregl.Popup()
                    .setLngLat(event.features[0].geometry.coordinates)
                    .setHTML(html)
                    .addTo(map);
            });

            map.on("mouseenter", "covid-counts-point", () => {
                map.getCanvas().style.cursor = "pointer";
            });

            map.on("mouseleave", "covid-counts-point", () => {
                map.getCanvas().style.cursor = "";
            });
        } catch (error) {
            const el = document.getElementById("text-description");
            if (el) el.innerHTML = `<p>Failed to load map data: ${error.message}</p>`;
            console.error("Map 2 load error:", error);
        }
    });
}

if (isMap1) {
    initMap1();
} else if (isMap2) {
    initMap2();
}
