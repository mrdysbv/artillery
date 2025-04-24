<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Top Atışı Hesablama</title>
  <style>
    #map { height: 400px; }
    input { margin: 5px; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
</head>
<body>
  <h2>Top və Hədəf Koordinatları</h2>
  <input type="checkbox" id="lockCoords"> Koordinatları kilidlə<br>
  <label>Top X (lat): <input type="number" id="x1" step="0.000001"></label>
  <label>Top Y (lng): <input type="number" id="y1" step="0.000001"></label>
  <label>Top hündürlüyü (m): <input type="number" id="h1" step="1" value="0"></label><br>
  <label>Hədəf X (lat): <input type="number" id="x2" step="0.000001"></label>
  <label>Hədəf Y (lng): <input type="number" id="y2" step="0.000001"></label>
  <label>Hədəf hündürlüyü (m): <input type="number" id="h2" step="1" value="0"></label><br>
  <label>Sistem: 
    <select id="system">
      <option value="d30">D-30</option>
      <option value="d20">D-20</option>
      <option value="grad">Grad</option>
    </select>
  </label><br>
  <label>Əsas Atış İstiqaməti (°): <input type="number" id="gunAngle" value="0"></label>
  <button onclick="calculate()">Hesabla</button>
  <div id="output"></div>
  <div id="map"></div>

<script>
let clickCount = 0;
let lockedLat = null;
let lockedLng = null;
let map = L.map('map').setView([40.4093, 49.8671], 13);

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    map.setView([pos.coords.latitude, pos.coords.longitude], 14);
  });
}

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let topMarker, hedefMarker, line;

const systems = {
  d30: { velocity: 690, maxRange: 15300 },
  d20: { velocity: 655, maxRange: 17400 },
  grad: { velocity: 690, maxRange: 20000 }
};

function lockCoordinates() {
  const checkbox = document.getElementById('lockCoords');
  const x1 = document.getElementById('x1');
  const y1 = document.getElementById('y1');

  if (checkbox.checked) {
    lockedLat = parseFloat(x1.value);
    lockedLng = parseFloat(y1.value);
    x1.disabled = true;
    y1.disabled = true;

    if (topMarker) map.removeLayer(topMarker);
    topMarker = L.marker([lockedLat, lockedLng]).addTo(map).bindPopup('Top').openPopup();
    map.setView([lockedLat, lockedLng], 14);
  } else {
    lockedLat = null;
    lockedLng = null;
    x1.disabled = false;
    y1.disabled = false;

    if (topMarker) map.removeLayer(topMarker);
  }
}

document.getElementById('lockCoords').addEventListener('change', lockCoordinates);

map.on('click', function(e) {
  const { lat, lng } = e.latlng;

  if (clickCount === 0) {
    document.getElementById('x1').value = lat.toFixed(6);
    document.getElementById('y1').value = lng.toFixed(6);
    if (topMarker) map.removeLayer(topMarker);
    topMarker = L.marker([lat, lng]).addTo(map).bindPopup('Top').openPopup();
    clickCount++;
  } else if (clickCount === 1) {
    document.getElementById('x2').value = lat.toFixed(6);
    document.getElementById('y2').value = lng.toFixed(6);
    if (hedefMarker) map.removeLayer(hedefMarker);
    hedefMarker = L.marker([lat, lng]).addTo(map).bindPopup('Hədəf').openPopup();
    clickCount++;
  } else {
    document.getElementById('x1').value = '';
    document.getElementById('y1').value = '';
    document.getElementById('x2').value = '';
    document.getElementById('y2').value = '';
    document.getElementById('output').innerHTML = '';
    if (topMarker) map.removeLayer(topMarker);
    if (hedefMarker) map.removeLayer(hedefMarker);
    if (line) map.removeLayer(line);
    clickCount = 0;
    alert("Sıfırlandı. Yeni top nöqtəsi təyin edin.");
  }
});

function calculate() {
  const x1 = parseFloat(document.getElementById('x1').value);
  const y1 = parseFloat(document.getElementById('y1').value);
  const h1 = parseFloat(document.getElementById('h1').value);
  const x2 = parseFloat(document.getElementById('x2').value);
  const y2 = parseFloat(document.getElementById('y2').value);
  const h2 = parseFloat(document.getElementById('h2').value);
  const system = document.getElementById('system').value;
  const gunAngle = parseFloat(document.getElementById('gunAngle').value) || 0;

  const dx = (y2 - y1) * 111320 * Math.cos((x1 + x2) * Math.PI / 360);
  const dy = (x2 - x1) * 110540;
  const dz = h2 - h1;

  const groundDistance = Math.sqrt(dx * dx + dy * dy);
  const totalDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  let azimuthDeg = (Math.atan2(dx, dy) * 180 / Math.PI);
  azimuthDeg = (azimuthDeg + 360) % 360;

  const deltaDeg = (((azimuthDeg - gunAngle) + 540) % 360 - 180).toFixed(2);

  const v = systems[system].velocity;
  const g = 9.81;
  const insideRange = groundDistance <= systems[system].maxRange;
  let elevation = null;

  if (insideRange) {
    const thetaRad = Math.atan2(dz, groundDistance);
    elevation = (thetaRad * 180 / Math.PI).toFixed(2);
  }

  let result = `
    <strong>Yer Yüzeyi Mesafesi:</strong> ${groundDistance.toFixed(2)} m<br>
    <strong>Yüksəklik fərqi:</strong> ${dz.toFixed(2)} m<br>
    <strong>Hədəfin şimala nəzərən bucağı:</strong> ${azimuthDeg.toFixed(2)}°<br>
    <strong>Əsas Atış Bucağına görə:</strong> ${deltaDeg}°<br>
  `;

  if (insideRange && elevation !== null) {
    result += `<strong>Topun Yüksəlmə Bucağı:</strong> ${elevation}°`;
  } else {
    result += `<span style='color:red'><strong>Hədəf mənzil xaricindədir!</strong></span>`;
  }

  document.getElementById('output').innerHTML = result;

  if (line) map.removeLayer(line);
  line = L.polyline([[x1, y1], [x2, y2]], { color: insideRange ? 'lime' : 'red' }).addTo(map);

  if (!document.getElementById('lockCoords').checked) {
    if (topMarker) map.removeLayer(topMarker);
    topMarker = L.marker([x1, y1]).addTo(map).bindPopup('Top').openPopup();
  }
}
</script>
</body>
</html>
