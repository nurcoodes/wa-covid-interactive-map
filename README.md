# US COVID-19 Interactive Thematic Maps (2020)

This project contains two county-level web maps for 2020 COVID-19 data in the United States:

1. `map1.html`: choropleth map of case rates (cases per 1,000 residents).
2. `map2.html`: proportional symbol map of total case counts.

## Map Links

- `map1.html`
- `map2.html`

For GitHub Pages deployment, use:

- `https://nurcoodes.github.io/wa-covid-interactive-map/map1.html`
- `https://nurcoodes.github.io/wa-covid-interactive-map/map2.html`

## Libraries In Use

- [MapLibre GL JS](https://maplibre.org/)
- [Google Fonts (Open Sans)](https://fonts.google.com/specimen/Open+Sans)

## Data Sources

- COVID-19 county cases/deaths: The New York Times
- Population (for rates): 2018 ACS 5-year estimates
- County boundaries: U.S. Census Bureau
- Data prepared for GEOG 450 lab

## Project Structure

```text
[repository]
|-- map1.html
|-- map2.html
|-- README.md
|-- assets/
|   |-- us-covid-2020-counts.geojson
|   `-- us-covid-2020-rates.geojson
|-- css/
|   `-- style.css
`-- js/
    `-- main.js
```

## Credit and Acknowledgment

- Lab framework and instructions: GEOG 450
- Instructor: Bo Zhao
- Basemap tiles: CARTO and OpenStreetMap contributors
