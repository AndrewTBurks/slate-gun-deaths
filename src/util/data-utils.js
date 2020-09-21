export const cleanEntry = (d, abbrev) => {
  const datePieces = d.date.split("-");

  return {
    ...d,
    age: +d.age,
    ageGroup: +d.ageGroup,
    date: new Date(datePieces[0], datePieces[1] - 1, datePieces[2]),
    lat: +d.lat,
    lng: +d.lng,
    victimID: +d.victimID,
    state: abbrev[d.state],
    state2: d.state,
  };
};

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

export function remapKeys(data, keyMap) {
  if (!keyMap) {
    return data;
  }

  return Object.fromEntries(
    Object.entries(data)
      .filter(([k]) => keyMap[k])
      .map(([k, v]) => [keyMap[k], v])
  );
}

export function normalize(data) {
  const total = d3.sum(Object.values(data));

  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v / total])
  );
}

export function filterByDateRange(cleanData, dateRange) {
  return cleanData.filter(
    (d) =>
      d.date.getTime() >= dateRange[0].getTime() &&
      d.date.getTime() <= dateRange[1].getTime()
  );
}

export function filterByState(cleanData, stateName) {
  return cleanData.filter((d) => d.state === stateName);
}
