import { groupBy } from "./util/data-utils.js";

let topo = null;
let STATES = null;
let NATION = null;

const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
const path = d3.geoPath(projection);

let statesGroup = null;
let nationGroup = null;
let spikeGroup = null;

export default function render({ svg, width, height }, data, onSelect) {
  const byState = groupBy(data, "state");
  const maxCount = d3.max(Object.values(byState), (d) => d.length);
  const domain = d3.range(0, maxCount, maxCount / 8);

  console.log(domain);

  const colorScale = d3
    .scaleSequential(d3.interpolateMagma)
    .domain([0, maxCount]);

  if (!statesGroup) {
    statesGroup = svg
      .append("g")
      .attr("class", "states-g")
      .attr("transform", "translate(40, 40)");

    nationGroup = svg
      .append("g")
      .attr("class", "nation-g")
      .attr("transform", "translate(40, 40)");

    spikeGroup = svg
      .append("g")
      .attr("class", "spike-g")
      .attr("transform", "translate(40, 40)");
  }

  svg
    .attr("viewBox", "0 0 1000 700")
    .attr("preserveAspectRatio", "xMidYMid meet");

  getStates().then(({ states, nation }) => {
    console.log(states, nation);

    statesGroup
      .selectAll("path")
      .data(states)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", (d) =>
        colorScale(
          byState[d.properties.name] && byState[d.properties.name].length
        )
      )
      .on("mouseover", function (evt, d) {
        d3.select(this).raise();

        const stateByLocation = groupBy(byState[d.properties.name], [
          "lat",
          "lng",
        ]);

        spikeGroup
          .selectAll(".spike")
          .data(Object.keys(stateByLocation))
          .join("line")
          .each(function (d) {
            const [lat, lng] = d.split("~").map((d) => +d);

            const [x, y] = projection([lng, lat]);

            d3.select(this)
              .attr("x1", x)
              .attr("x2", x)
              .attr("y1", y)
              .attr("y2", y)
              .transition()
              .duration(1000)
              .attr("y2", y - stateByLocation[d].length / 2);
          })
          .attr("class", "spike");
      })
      .on("mouseout", function (evt, d) {
        d3.select(this).raise();

        const stateByLocation = groupBy(byState[d.properties.name], [
          "lat",
          "lng",
        ]);

        spikeGroup.selectAll(".spike").remove();
      })
      // .attr("fill-opacity", 0.25)
      .append("title")
      .text((d) => {
        return `${d.properties.name}`;
      });

    nationGroup
      .selectAll("path")
      .data(nation)
      .join("path")
      .attr("class", "nation")
      .attr("d", path);

    console.log(nation);
  });
}

function getStates() {
  return new Promise((resolve, reject) => {
    if (!topo || !STATES) {
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")

        .then((us) => {
          topo = us;
          console.log(us);

          STATES = topojson.feature(us, us.objects.states, (a, b) => a !== b)
            .features;
          NATION = topojson.feature(us, us.objects.nation, (a, b) => a !== b)
            .features;

          resolve({ states: STATES, nation: NATION });
        })
        .catch(reject);
    } else {
      resolve({ states: STATES, nation: NATION });
    }
  });
}
