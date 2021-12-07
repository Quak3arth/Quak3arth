import earthquakeJson from '@/assets/earthquake.json'
export { BLH2XYZ }
export { getEarthquakeRelations }
export { getEarthquakeByDateAndMag }

function BLH2XYZ (lng, lat, radius) {
  const phi = (180 + lng) * (Math.PI / 180)
  const theta = (90 - lat) * (Math.PI / 180)
  return {
    x: -radius * Math.sin(theta) * Math.cos(phi),
    y: radius * Math.cos(theta),
    z: radius * Math.sin(theta) * Math.sin(phi)
  }
}

function getEarthquakeRelations (clickId) {
  var showList = []
  var currentTag = earthquakeJson[clickId].tag
  if (currentTag === '') {
    return showList
  }
  for (var i = 0; i < earthquakeJson.length; i++) {
    if (earthquakeJson[i].tag === currentTag) {
      showList.push(earthquakeJson[i])
    }
  }
  return showList
}

function getEarthquakeByDateAndMag (startDate, endDate, minMagnitude, maxMagnitude) {
  var earthquakes = []
  var start = new Date(startDate)
  var end = new Date(endDate)
  for (let i = 0; i < earthquakeJson.length; i++) {
    const date = new Date(earthquakeJson[i].date)
    if (date > end) {
      break
    }
    if (date >= start) {
      if (earthquakeJson[i].magnitude >= minMagnitude && earthquakeJson[i].magnitude <= maxMagnitude) {
        earthquakes.push(earthquakeJson[i])
      }
    }
  }
  return earthquakes
}
