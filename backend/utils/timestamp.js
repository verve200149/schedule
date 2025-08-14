// utils/timestamp.js
function getTimestampFilename(vesselName = 'UNKNOWN') {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hr = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');

  const safeName = vesselName.replace(/\s+/g, '').replace(/[^\w]/g, '').toUpperCase();

  return `${y}${m}${d}_${hr}${min}${sec}_${safeName}.json`;
}

function toTaiwanTime(utcString) {
  const date = new Date(utcString);
  const taiwanDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return taiwanDate.toISOString().replace('Z', '+08:00');
}

module.exports = { getTimestampFilename, toTaiwanTime };
