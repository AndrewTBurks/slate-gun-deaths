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

export function groupBy(cleanData, attrs) {
  const grouped = {};

  for (let d of cleanData) {
    const key = Array.isArray(attrs)
      ? attrs.map((attr) => d[attr]).join("~")
      : d[attrs];
    if (!grouped[key]) grouped[key] = [];

    grouped[key].push(d);
  }

  return grouped;
}
