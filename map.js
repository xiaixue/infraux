let markerImages = {"Pozo de absorción": "absortion well",
"Subestaciones generales": "electricidad_sub",
"Subestaciones derivadas": "electricidad_sub_1",
"Contenedores de residuos": "trash containe",
"Pozos de extracción": "water_well_1",
"Pozos de absorción": "absortion well",
"Cafeterías": "coffe", 
"Barras de alimentos": "coffe",
"Módulos y comercios": "small_store"}

function latlonToUTM(lat, lon) {
  // WGS84 ellipsoid parameters
  const a = 6378137.0;              // semi-major axis (m)
  const f = 1 / 298.257223563;      // flattening
  const k0 = 0.9996;                // scale factor

  // Derived parameters
  const e = Math.sqrt(f * (2 - f)); // eccentricity

  // UTM zone
  const zone = Math.floor((lon + 180) / 6) + 1;

  // Central meridian
  const lon0 = (zone - 1) * 6 - 180 + 3;
  const lon0Rad = lon0 * Math.PI / 180;

  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;

  // Auxiliary values
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);

  const N = a / Math.sqrt(1 - e * e * sinLat * sinLat);
  const T = Math.tan(latRad) ** 2;
  const C = (e * e / (1 - e * e)) * cosLat * cosLat;
  const A = cosLat * (lonRad - lon0Rad);

  // Meridional arc
  const M = a * (
    (1 - e ** 2 / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256) * latRad
    - (3 * e ** 2 / 8 + 3 * e ** 4 / 32 + 45 * e ** 6 / 1024) * Math.sin(2 * latRad)
    + (15 * e ** 4 / 256 + 45 * e ** 6 / 1024) * Math.sin(4 * latRad)
    - (35 * e ** 6 / 3072) * Math.sin(6 * latRad)
  );

  // Easting
  const easting = k0 * N * (
    A
    + (1 - T + C) * A ** 3 / 6
    + (5 - 18 * T + T ** 2 + 72 * C - 58 * (e ** 2 / (1 - e ** 2))) * A ** 5 / 120
  ) + 500000.0;

  // Northing
  let northing = k0 * (
    M + N * Math.tan(latRad) * (
      A ** 2 / 2
      + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24
      + (61 - 58 * T + T ** 2 + 600 * C - 330 * (e ** 2 / (1 - e ** 2))) * A ** 6 / 720
    )
  );

  // Southern hemisphere correction
  if (lat < 0) {
    northing += 10000000.0;
  }

  return { easting, northing, zone };
}

function utmToLatLon(easting, northing, zone, isSouthernHemisphere = false) {
  // WGS84 parameters
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;

  const e = Math.sqrt(f * (2 - f));
  const e2 = e * e;
  const ePrime2 = e2 / (1 - e2);

  // Remove false easting
  const x = easting - 500000.0;

  // Remove false northing if southern hemisphere
  let y = northing;
  if (isSouthernHemisphere) {
    y -= 10000000.0;
  }

  // Central meridian
  const lon0 = (zone - 1) * 6 - 180 + 3;
  const lon0Rad = lon0 * Math.PI / 180;

  // Meridional arc
  const M = y / k0;

  // Footpoint latitude
  const mu = M / (
    a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256)
  );

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const J1 = (3 * e1 / 2 - 27 * e1 ** 3 / 32);
  const J2 = (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32);
  const J3 = (151 * e1 ** 3 / 96);
  const J4 = (1097 * e1 ** 4 / 512);

  const lat1 = mu
    + J1 * Math.sin(2 * mu)
    + J2 * Math.sin(4 * mu)
    + J3 * Math.sin(6 * mu)
    + J4 * Math.sin(8 * mu);

  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const tanLat1 = Math.tan(lat1);

  const N1 = a / Math.sqrt(1 - e2 * sinLat1 ** 2);
  const T1 = tanLat1 ** 2;
  const C1 = ePrime2 * cosLat1 ** 2;
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * sinLat1 ** 2, 1.5);
  const D = x / (N1 * k0);

  // Latitude
  const latRad = lat1 - (N1 * tanLat1 / R1) * (
    D ** 2 / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ePrime2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ePrime2 - 3 * C1 ** 2) * D ** 6 / 720
  );

  // Longitude
  const lonRad = lon0Rad + (
    D
    - (1 + 2 * T1 + C1) * D ** 3 / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ePrime2 + 24 * T1 ** 2) * D ** 5 / 120
  ) / cosLat1;

  return {
    lat: latRad * 180 / Math.PI,
    lon: lonRad * 180 / Math.PI
  };
}

function ageIntensity(dat_inst) {
  const install = new Date(dat_inst);
  const now = new Date();
  const ageYears = (now - install) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.min(Math.max(ageYears / 10, 0), 1);
}

function radiusFromCap(cap) {
  return 0.0286 * cap + 21.429;
}

const GAS_GRADIENT = {
  0.0: '#0000ff',   // deep blue
  0.3: '#0000ff',   // keep blue strong longer
  0.5: '#00ff00',
  0.75: '#ffff00',
  1.0: '#ff0000'
};

const gasHeatLayers = [];

function makeCategoryIcon(categoryName) {
  const img = markerImages[categoryName];
  if (!img) return null;

  return L.icon({
    iconUrl: `assets/${img}.png`,
    iconSize: [28, 28],        // adjust if needed
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
}


function markerRadius(zoom) {
  if (zoom <= 14) return 6;
  if (zoom <= 16) return 4;
  return 3;
}

function heatRadius(base, zoom) {
  if (zoom <= 13) return base * 0.25;
  if (zoom <= 14) return base * 0.35;
  if (zoom <= 15) return base * 0.5;
  if (zoom <= 16) return base * 0.7;
  return base;
}

const markerIndex = {};
let activeSearchMarker = null;

/* =========================   MAP INITIALIZATION ========================= */

const map = L.map('map').setView([19.4326, -99.1332], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

const highlightIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/* ========================= AREA OF INTEREST POLYGON ========================= */

let areaPolygon = null;

function loadAreaPolygon(cu_pol) {
  const latlngs = cu_pol.map(p => {
    const coords = utmToLatLon(
      p[0],     // easting (x)
      p[1],     // northing (y)
      14,       // UTM zone
      false     // northern hemisphere
    );

    return [coords.lat, coords.lon];
  });

  areaPolygon = L.polygon(latlngs, {
    color: 'red',
    weight: 2,
    fillOpacity: 0.05
  }).addTo(map);

  map.fitBounds(areaPolygon.getBounds());
  map.invalidateSize();
}

fetch('locations.json')
  .then(r => r.json())
  .then(data => {
    if (!data.cu_pol) {
      console.error('cu_pol missing from locations.json');
      return;
    }
    loadAreaPolygon(data.cu_pol);
    initCategories(data);
  });

/* =========================   LAYERS ========================= */

const layers = {};

function buildCategoryLayer(categoryName, categoryObj) {
  const group = L.layerGroup();
  
  Object.entries(categoryObj).forEach(([name, obj]) => {
    if (name.startsWith('_')) return;
    if (!obj || typeof obj !== 'object') return;
    if (obj.x === undefined || obj.y === undefined) return;
    if (obj.x === 0 && obj.y === 0) return;

    let lat, lon;

    if (Math.abs(obj.x) <= 180 && Math.abs(obj.y) <= 90) {
      // Already lat/lon (x = lon, y = lat)
      lon = obj.x;
      lat = obj.y;
    } else {
      // UTM → lat/lon
      const coords = utmToLatLon(obj.x, obj.y, 14, false);
      lat = coords.lat;
      lon = coords.lon;
    }

    const icon = makeCategoryIcon(categoryName);

    const marker = L.marker(
      [lat, lon],
      icon ? { icon } : undefined
    ).bindPopup(`<strong>${name}</strong><br>${categoryName}`);


    marker._defaultIcon = marker.options.icon; // store original icon
    markerIndex[name] = marker;

    group.addLayer(marker);

  });

  return group;
}

function buildLineCategoryLayer(categoryObj) {
  const group = L.layerGroup();

  Object.entries(categoryObj).forEach(([name, multilines]) => {
    if (name.startsWith('_')) return;
    if (!Array.isArray(multilines)) return;

    multilines.forEach(line => {
      if (!Array.isArray(line) || line.length < 2) return;

      const latlngs = line.map(p => {
        const { lat, lon } = utmToLatLon(p[0], p[1], 14, false);
        return [lat, lon];
      });

      const poly = L.polyline(latlngs, {
        color: '#ff6600',
        weight: 3
      }).bindPopup(name);

      group.addLayer(poly);
    });
  });

  return group;
}


function groupByMainCategory(data) {
  const grouped = {};

  Object.entries(data).forEach(([categoryName, categoryObj]) => {
    if (categoryName === 'cu_pol') return;
    if (!categoryObj || typeof categoryObj !== 'object') return;

    const main = categoryObj._type_cat || 'Other';

    if (!grouped[main]) grouped[main] = {};
    grouped[main][categoryName] = categoryObj;
  });

  return grouped;
}

function initCategories(data) {
  const controls = document.getElementById('controls');
  const grouped = groupByMainCategory(data);

  Object.entries(grouped).forEach(([mainName, subcats]) => {

    /* ===== MAIN CHECKBOX ===== */
    const mainLabel = document.createElement('label');
    mainLabel.className = 'layer-item';

    const mainCheckbox = document.createElement('input');
    mainCheckbox.type = 'checkbox';
    mainCheckbox.checked = true;

    const mainText = document.createElement('span');
    mainText.textContent = mainName;

    mainLabel.appendChild(mainCheckbox);
    mainLabel.appendChild(mainText);
    controls.appendChild(mainLabel);

    /* ===== SUBCONTAINER ===== */
    const subContainer = document.createElement('div');
    subContainer.className = 'subcategory';
    controls.appendChild(subContainer);

    const subLayers = [];

    /* ===== SUBCATEGORIES ===== */
    Object.entries(subcats).forEach(([categoryName, categoryObj]) => {
      let layer;

      if (categoryName === "Tanques de gas") {
        const heatLayers = buildGasHeatLayers(categoryObj);
        layer = L.layerGroup(Object.values(heatLayers));
      } 
      else {
        if (categoryName === "Red eléctrica") {
          layer = buildLineCategoryLayer(categoryObj); }
        else {
          layer = buildCategoryLayer(categoryName, categoryObj);}
      }

      layers[categoryName] = layer;
      layer.addTo(map);
      subLayers.push(layer);


      const label = document.createElement('label');
      label.className = 'layer-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;

      const text = document.createElement('span');
      text.textContent = categoryName;

      checkbox.addEventListener('change', e => {
        e.target.checked ? layer.addTo(map) : layer.remove();
        syncMainCheckbox();
      });

      label.appendChild(checkbox);
      label.appendChild(text);
      subContainer.appendChild(label);
    });

    /* ===== MAIN → SUB ===== */
    mainCheckbox.addEventListener('change', e => {
      subContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = e.target.checked;
      });

      subLayers.forEach(l =>
        e.target.checked ? l.addTo(map) : l.remove()
      );

      mainCheckbox.indeterminate = false;
    });

    /* ===== SUB → MAIN ===== */
    function syncMainCheckbox() {
      const subs = subContainer.querySelectorAll('input[type="checkbox"]');
      const checked = [...subs].filter(cb => cb.checked).length;

      mainCheckbox.checked = checked === subs.length;
      mainCheckbox.indeterminate = checked > 0 && checked < subs.length;
    }
  });
}


document.getElementById('searchBox').addEventListener('input', e => {
  const query = e.target.value.trim();

  // Reset previous highlight
  if (activeSearchMarker) {
    activeSearchMarker.setIcon(activeSearchMarker._defaultIcon);
    activeSearchMarker = null;
  }

  if (!query) return;

  const marker = markerIndex[query];
  if (!marker) return;

  marker.setIcon(highlightIcon);
  marker.openPopup();
  map.setView(marker.getLatLng(), 18);

  activeSearchMarker = marker;
});

/* ========================= TOPOGRAFÍA RASTER ========================= */

// ---- Raster bounds (from Python) ----
const x_min = 478809.214;
const x_max = 482233.214;
const y_min = 2134700.986;
const y_max = 2138204.986;

// ---- Convert bounds ----
const sw = utmToLatLon(x_min, y_min, 14, false);
const ne = utmToLatLon(x_max, y_max, 14, false);

const imageBounds = [
  [sw.lat, sw.lon],
  [ne.lat, ne.lon]
];

// ---- Layer ---- //

const topoLayer = L.layerGroup();

const topoOverlay = L.imageOverlay("elevation.png", imageBounds, {
  opacity: 0.6
});

topoLayer.addLayer(topoOverlay);
topoLayer.addTo(map);


/* ========================= TOPOGRAFÍA LEGEND ========================= */

const topoLegend = L.control({ position: "bottomright" });

topoLegend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `
    <strong>Elevation (m)</strong><br>
    <img src="legend_topografia.png" style="width:120px;">
  `;
  return div;
};

topoLegend.addTo(map);


/* ========================= TOPOGRAFÍA CHECKBOX ========================= */

const topoControls = document.getElementById("controls");

const topoLabel = document.createElement("label");
topoLabel.className = "layer-item";

const topoCheckbox = document.createElement("input");
topoCheckbox.type = "checkbox";
topoCheckbox.checked = true;

const topoText = document.createElement("span");
topoText.textContent = "Topografía";

topoCheckbox.addEventListener("change", e => {
  if (e.target.checked) {
    topoLayer.addTo(map);
    topoLegend.addTo(map);
  } else {
    topoLayer.remove();
    topoLegend.remove();
  }
});

topoLabel.appendChild(topoCheckbox);
topoLabel.appendChild(topoText);
topoControls.appendChild(topoLabel);

/* ========================= GAS Heatmap ========================= */

function buildGasHeatLayers(categoryObj) {
  const buckets = { small: [], medium: [], large: [] };

  Object.entries(categoryObj).forEach(([id, obj]) => {
    if (id.startsWith('_')) return;
    if (obj.x == null || obj.y == null || !obj.dat_inst || obj.cap == null) return;

    const { lat, lon } = utmToLatLon(obj.x, obj.y, 14, false);
    const intensity = ageIntensity(obj.dat_inst);
    const point = [lat, lon, intensity];

    if (obj.cap <= 300) buckets.small.push(point);
    else if (obj.cap <= 500) buckets.medium.push(point);
    else buckets.large.push(point);
  });

  const small = L.heatLayer(buckets.small, {
    radius: radiusFromCap(300),
    blur: 20,
    maxZoom: 18,
    gradient: GAS_GRADIENT
  });

  const medium = L.heatLayer(buckets.medium, {
    radius: radiusFromCap(500),
    blur: 25,
    maxZoom: 18,
    gradient: GAS_GRADIENT
  });

  const large = L.heatLayer(buckets.large, {
    radius: radiusFromCap(1000),
    blur: 30,
    maxZoom: 18,
    gradient: GAS_GRADIENT
  });

  gasHeatLayers.push(
    { layer: small, base: radiusFromCap(300) },
    { layer: medium, base: radiusFromCap(500) },
    { layer: large, base: radiusFromCap(1000) }
  );

  return { small, medium, large };
}


map.on('zoomend', () => {
  const z = map.getZoom();
  gasHeatLayers.forEach(h => {
    if (!map.hasLayer(h.layer)) return;   // ← REQUIRED
    h.layer.setOptions({
      radius: heatRadius(h.base, z),
      blur: z <= 14 ? 10 : z <= 16 ? 18 : 25
    });
  });
});
