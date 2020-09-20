import MapClass from "./map.js";
import Timeline from "./timeline.js";
import Details from "./details.js";
import createSvg, { createView } from "./util/create-svg.js";
import { groupBy, countBy, cleanData } from "./util/data-utils.js";

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

  console.log(data.current);
  console.log(groupBy(data.current, "state"));
  console.log(countBy(data.current, ["lat", "lng"]));

  const onSelectTime = (dateRange) => {
    console.log(dateRange);
  };

  const onSelectState = (state) => {
    console.log(state);
  };

  const mapView = createView(".map", MapClass, () => data.current);
  const timelineView = createView(".timeline", Timeline, () => allData);
  const statsView = createView(".stats", Details, () => data.current);

  timelineView.onSelect((dateRange) => {
    if (dateRange === null) {
      data.current = allData;
    } else {
      data.current = allData.filter(
        (d) =>
          d.date.getTime() > dateRange[0].getTime() &&
          d.date.getTime() < dateRange[1].getTime()
      );
    }

    mapView.render();
  });
});
