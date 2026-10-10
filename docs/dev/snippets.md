# Snippets

Code kept around for reference — not currently wired into the app.

## Raster tile fallback for the map

If the Jawg vector tiles are ever unavailable, this CARTO raster layer is a
drop-in Leaflet fallback (no API token required):

```js
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; CARTO'
}).addTo(map)
```
