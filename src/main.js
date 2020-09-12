import renderMap from "./map.js";
import createSvg from "./util/create-svg.js";
import { groupBy, cleanEntry, cleanData } from "./util/data-utils.js";

Promise.all([
  d3.csv("./data/SlateGunDeaths.csv"),
  d3.csv("./data/states.csv"),
]).then(([raw, abbrev]) => {
  const data = cleanData(
    raw,
    Object.fromEntries(
      abbrev.map(({ State, Abbreviation }) => [Abbreviation, State])
    )
  );

  console.log(data);
  console.log(groupBy(data, "state"));
  console.log(Object.keys(groupBy(data, ["lat", "lng"])).length);

  createSvg(".map", (info) =>
    renderMap(info, data, (...args) => console.log(args))
  );
  createSvg(".timeline", console.log);
  createSvg(".stats", console.log);
});
