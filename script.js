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

  // Yüksəlmə bucağını hesabla (yalnız yer səthi məsafəsinə görə)
  if (insideRange) {
    const sin2Theta = (g * groundDistance) / (v * v);
    if (sin2Theta >= 0 && sin2Theta <= 1) {
      const angleRad = 0.5 * Math.asin(sin2Theta);
      elevation = (angleRad * 180 / Math.PI).toFixed(2);
    }
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
    result += `<span style='color:red'><strong>Hədəf mənzil xaricindədir və ya fiziki olaraq mümkün deyil!</strong></span>`;
  }

  document.getElementById('output').innerHTML = result;

  if (line) map.removeLayer(line);
  line = L.polyline([[x1, y1], [x2, y2]], { color: insideRange ? 'lime' : 'red' }).addTo(map);

  if (!document.getElementById('lockCoords').checked) {
    if (topMarker) map.removeLayer(topMarker);
    topMarker = L.marker([x1, y1]).addTo(map).bindPopup('Top').openPopup();
  }
}
