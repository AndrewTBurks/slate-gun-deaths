import { groupBy } from "./util/data-utils.js";

let topo = null;
let STATES = null;
let NATION = null;

const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
const path = d3.geoPath(projection);

let statesGroup = null;
let nationGroup = null;

let overlayGroup = null;
let spikeGroup = null;

const svgWidth = 1000;
const svgHeight = 700;

const extent = [
  [20, 20],
  [960, 660],
];

export default function render({ svg, width, height }, data, onSelect) {
  const byState = groupBy(data, "state");
  const maxCount = d3.max(Object.values(byState), (d) => d.length);
  const domain = d3.range(0, maxCount, maxCount / 8);

  const colorScale = d3
    .scaleSequential(d3.interpolateMagma)
    .domain([0, maxCount]);

  if (!statesGroup) {
    nationGroup = svg.append("g").attr("class", "nation-g");

    statesGroup = svg.append("g").attr("class", "states-g");
    // .attr("transform", "translate(-40, -40)");

    // .attr("transform", "translate(-40, -40)");

    overlayGroup = svg.append("g").attr("class", "overlay");
    overlayGroup
      .append("rect")
      .attr("class", "indicator")
      .style("transform", `translate3d(500px, 350px, 0)`)
      .attr("width", 0)
      .attr("height", 0);

    overlayGroup
      .append("g")
      .attr("class", "overlay-container")
      .style("transform", `translate3d(500px, 350px, 0)`)
      .append("rect")
      .attr("class", "overlay-bg")
      .attr("width", 0)
      .attr("height", 0);

    spikeGroup = overlayGroup.append("g").attr("class", "spike-g");
    // .attr("transform", "translate(-40, -40)");
  }

  svg
    .attr("viewBox", "0 0 1000 700")
    .attr("preserveAspectRatio", "xMidYMid meet");

  getStates().then(({ states, nation }) => {
    console.log(states, nation);

    projection.fitExtent(extent, nation[0]);

    svg.on("click", (evt) => {
      evt.preventDefault();

      hideOverlay();

      // projection.fitExtent(extent, nation[0]);
      // spikeGroup.selectAll(".spike").attr("visibility", "hidden");
      updateStatesAndNation(colorScale, byState);
    });

    statesGroup
      .selectAll(".state")
      .data(states)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .style("transform-origin", (d) =>
        path
          .centroid(d)
          .map((coord) => `${coord}px`)
          .join(" ")
      )
      .style("fill", (d) =>
        colorScale(
          byState[d.properties.name] && byState[d.properties.name].length
        )
      )
      .on("mouseover", function (evt) {
        d3.select(this).raise();
      })
      .on("mouseleave", function (evt) {
        if (!d3.select(this).classed("selected")) {
          d3.select(this).lower();
        }
      })
      .on("click", function (evt, d) {
        evt.stopPropagation();

        spikeGroup.selectAll(".spike").attr("visibility", "hidden");

        const stateByLocation = groupBy(byState[d.properties.name], [
          "lat",
          "lng",
        ]);

        // projection.fitExtent(stateFitExtent, d);

        const isSelected = !d3.select(this).classed("selected");
        updateStatesAndNation(colorScale, byState);

        d3.select(this).classed("selected", isSelected);
        // .style("fill", colorScale(0));

        onSelect(isSelected ? d : null);

        console.log(isSelected);

        if (isSelected) {
          showOverlay(d, stateByLocation);

          d3.select(this).raise();
        } else {
          hideOverlay();

          d3.select(this).lower();
        }

        // spikeGroup
        //   .selectAll(".spike")
        //   .data(Object.keys(stateByLocation))
        //   .join("line")
        //   .each(function (d) {
        //     const [lat, lng] = d.split("~").map((d) => +d);

        //     const [x, y] = projection([lng, lat]);

        //     d3.select(this)
        //       .attr("visibility", "hidden")
        //       .attr("x1", x)
        //       .attr("x2", x)
        //       .attr("y1", y)
        //       .attr("y2", y)
        //       .transition()
        //       .delay(500)
        //       .attr("visibility", "visible")
        //       .attr("y2", y - stateByLocation[d].length / 2);
        //   })
        //   .attr("class", "spike");
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

function showOverlay(state, stateData) {
  const boxMargin = 15;
  const containerMargin = 40;
  const bounds = path.bounds(state);

  console.log(bounds);

  const [x, y] = [bounds[0][0] - boxMargin, bounds[0][1] - boxMargin];

  const [width, height] = [
    bounds[1][0] - bounds[0][0] + boxMargin * 2,
    bounds[1][1] - bounds[0][1] + boxMargin * 2,
  ];

  const direction = x + width / 2 > 500 ? "left" : "right";
  const space = [
    direction === "left"
      ? x - containerMargin * 2
      : 1000 - (x + width) - containerMargin * 2,
    700 - containerMargin * 2,
  ];

  overlayGroup.classed("open", true);

  overlayGroup
    .select(".indicator")
    .style("opacity", 1)
    .style("transform", `translate3d(${x}px, ${y}px, 0)`)
    .attr("width", width)
    .attr("height", height);

  overlayGroup
    .select(".overlay-container")
    .style(
      "transform",
      `translate3d(${
        direction === "left" ? containerMargin : x + width + containerMargin
      }px, ${containerMargin}px, 0)`
    );

  overlayGroup
    .select(".overlay-bg")
    .style("opacity", 1)
    .attr("width", space[0])
    .attr("height", space[1]);

  const overlayProjection = d3.geoAlbersUsa().fitExtent(
    [
      [boxMargin, boxMargin],
      [space[0] - 2 * boxMargin, space[1] - 2 * boxMargin],
    ],
    state
  );

  overlayGroup
    .select(".overlay-container")
    .selectAll(".selected-state")
    .data([state])
    .join("path")
    .attr("class", "selected-state")
    .attr("d", d3.geoPath(overlayProjection));

  overlayGroup
    .select(".overlay-container")
    .selectAll(".spike")
    .data(Object.keys(stateData))
    .join("line")
    .each(function (d) {
      const [lat, lng] = d.split("~").map((d) => +d);

      const [x, y] = overlayProjection([lng, lat]);

      d3.select(this)
        .attr("visibility", "hidden")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", y)
        .attr("y2", y)
        .transition()
        .delay(500)
        .attr("visibility", "visible")
        .attr("y2", y - stateData[d].length / 2);
    })
    .attr("class", "spike");
}

function hideOverlay() {
  overlayGroup.classed("open", false);

  overlayGroup
    .select(".indicator")
    // .style("transform", function () {
    //   const el = d3.select(this);
    //   console.log(d3.select(this).style("transform"));
    //   const [
    //     string,
    //     x,
    //     y,
    //   ] = /translate3d\(([\d\.]*)px,\s*([\d\.]*)px,\s*[\d\.]*px\)/.exec(
    //     d3.select(this).style("transform")
    //   );

    //   const [width, height] = [el.attr("width"), el.attr("height")];

    //   return `translate3d(${+x + +width / 2}px, ${+y + +height / 2}px, 0)`;
    // })
    .attr("width", 0)
    .attr("height", 0);

  overlayGroup
    .select(".overlay-bg")
    // .style("transform", function () {
    //   const el = d3.select(this);
    //   console.log(d3.select(this).style("transform"));
    //   const [
    //     string,
    //     x,
    //     y,
    //   ] = /translate3d\(([\d\.]*)px,\s*([\d\.]*)px,\s*[\d\.]*px\)/.exec(
    //     d3.select(this).style("transform")
    //   );

    //   const [width, height] = [el.attr("width"), el.attr("height")];

    //   console.log(x, y, width, height);

    //   return `translate3d(${+x + +width / 2}px, ${+y + +height / 2}px, 0)`;
    // })
    .attr("width", 0)
    .attr("height", 0);
}

function updateStatesAndNation(colorScale, byState) {
  statesGroup
    .selectAll("path")
    .classed("selected", false)
    .style("fill", (d) =>
      colorScale(
        byState[d.properties.name] && byState[d.properties.name].length
      )
    )
    .style("stroke-width", null);
  // nationGroup.selectAll("path");
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
