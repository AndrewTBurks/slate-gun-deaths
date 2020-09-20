export const cleanEntry = (d, abbrev) => ({
  ...d,
  age: +d.age,
  ageGroup: +d.ageGroup,
  date: new Date(d.date),
  lat: +d.lat,
  lng: +d.lng,
  victimID: +d.victimID,
  state: abbrev[d.state],
});

export function cleanData(rawData, abbrev) {
  return rawData.map((row) => cleanEntry(row, abbrev));
}

export function countBy(cleanData, attrs) {
  const counts = {};

  for (let d of cleanData) {
    const key = Array.isArray(attrs)
      ? attrs.map((attr) => d[attr]).join("~")
      : attrs instanceof Function
      ? attrs(d)
      : d[attrs];
    if (!counts[key]) counts[key] = 0;

    counts[key]++;
  }

  return counts;
}

export function groupBy(cleanData, attrs) {
  const grouped = {};

  for (let d of cleanData) {
    const key = Array.isArray(attrs)
      ? attrs.map((attr) => d[attr]).join("~")
      : attrs instanceof Function
      ? attrs(d)
      : d[attrs];
    if (!grouped[key]) grouped[key] = [];

    grouped[key].push(d);
  }

  return grouped;
}
