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

  const R = Math.sqrt(dx * dx + dy * dy); // Yer səthi məsafəsi
  const h = dz;

  const azimuthDeg = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
  const deltaDeg = (((azimuthDeg - gunAngle) + 540) % 360 - 180).toFixed(2);

  const v = systems[system].velocity;
  const g = 9.81;

  const v2 = v * v;
  const discriminant = v2 * v2 - g * (g * R * R + 2 * h * v2);

  let result = `
    <strong>Yer məsafəsi:</strong> ${R.toFixed(2)} m<br>
    <strong>Hündürlük fərqi:</strong> ${h.toFixed(2)} m<br>
    <strong>Hədəfin istiqaməti:</strong> ${azimuthDeg.toFixed(2)}°<br>
    <strong>Əsas Atış Bucağına görə:</strong> ${deltaDeg}°<br>
  `;

  if (discriminant < 0) {
    result += `<span style="color:red;"><strong>Bu məsafə üçün trayektoriya mümkün deyil!</strong></span>`;
  } else {
    const sqrtDisc = Math.sqrt(discriminant);
    const angle1 = Math.atan((v2 - sqrtDisc) / (g * R)) * 180 / Math.PI;
    const angle2 = Math.atan((v2 + sqrtDisc) / (g * R)) * 180 / Math.PI;

    result += `
      <strong>Yüksəlmə bucaqları:</strong><br>
      - Aşağı: ${angle1.toFixed(2)}°<br>
      - Yuxarı: ${angle2.toFixed(2)}°
    `;
  }

  document.getElementById('output').innerHTML = result;

  if (line) map.removeLayer(line);
  line = L.polyline([[x1, y1], [x2, y2]], { color: discriminant >= 0 ? 'lime' : 'red' }).addTo(map);
}
