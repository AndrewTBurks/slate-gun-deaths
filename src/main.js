import MapClass from "./map.js";
import Timeline from "./timeline.js";
import Details from "./details.js";
import createSvg, { createView } from "./util/create-svg.js";
import {
  groupBy,
  countBy,
  cleanData,
  filterByDateRange,
  filterByState,
} from "./util/data-utils.js";

Promise.all([
  d3.csv("./data/SlateGunDeaths.csv"),
  d3.csv("./data/states.csv"),
]).then(([raw, abbrev]) => {
  const allData = cleanData(
    raw,
    Object.fromEntries(
      abbrev.map(({ State, Abbreviation }) => [Abbreviation, State])
    )
  );

  let data = { current: allData };
  let state = { current: null };
  let stateData = { current: null };

  const ageGrouped = groupBy(data.current, "ageGroup");

  console.log(ageGrouped);
  console.log(
    Object.fromEntries(
      Object.keys(ageGrouped).map((g) => [
        g,
        d3.extent(ageGrouped[g], (d) => d.age),
      ])
    )
  );

  const mapView = createView(".map", MapClass, () => data.current);
  const timelineView = createView(".timeline", Timeline, () => allData);
  const statsView = createView(".stats", Details, () => ({
    all: allData,
    time: data.current,
    state: stateData.current,
  }));

  timelineView.onSelect((dateRange) => {
    if (dateRange === null) {
      data.current = allData;
    } else {
      data.current = filterByDateRange(allData, dateRange);
    }

    if (state.current) {
      stateData.current = filterByState(data.current, state.current);
    }

    mapView.render();
    statsView.render();
  });

  mapView.onSelect((selectedState) => {
    if (selectedState) {
      if (selectedState.properties.name !== state.current) {
        state.current = selectedState.properties.name;
        stateData.current = filterByState(data.current, state.current);
      }
    } else {
      state.current = null;
      stateData.current = null;
    }

    statsView.render();
  });
});
