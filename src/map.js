import BaseView from "./view.js";
import { groupBy, countBy } from "./util/data-utils.js";

let topo = null;
let STATES = null;
let NATION = null;

const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
const path = d3.geoPath(projection);

const svgWidth = 1300;
const svgHeight = 700;

const extent = [
  [100, 20],
  [1200, 680],
];

export default class DetailsView extends BaseView {
  _onSelect = () => null;
  statesGroup = null;
  nationGroup = null;

  overlayGroup = null;
  spikeGroup = null;

  init() {
    const defs = this.svg.append("defs");

    const gradient = defs.append("radialGradient").attr("id", "dot");
    gradient
      .append("stop")
      .attr("stop-color", "#fb8072")
      .attr("stop-opacity", 0.75);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#999")
      .attr("stop-opacity", 0);

    const hatched = defs
      .append("pattern")
      .attr("id", "diag-hatch")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("viewBox", "0,0,4,4")
      .attr("width", 8)
      .attr("height", 8);

    hatched
      .append("path")
      .attr(
        "d",
        `M-1,1 l2,-2
      M0,4 l4,-4
      M3,5 l2,-2`
      )
      .attr("stroke", "#718096")
      .attr("stroke-width", 0.25);

    this.nationGroup = this.svg.append("g").attr("class", "nation-g");

    this.statesGroup = this.svg.append("g").attr("class", "states-g");
    // .attr("transform", "translate(-40, -40)");

    // .attr("transform", "translate(-40, -40)");

    this.overlayGroup = this.svg.append("g").attr("class", "overlay");
    this.overlayGroup
      .append("rect")
      .attr("class", "indicator")
      .style("transform", `translate3d(500px, 350px, 0)`)
      .attr("width", 0)
      .attr("height", 0);

    const container = this.overlayGroup
      .append("g")
      .attr("class", "overlay-container")
      .style("transform", `translate3d(500px, 350px, 0)`);

    container
      .append("rect")
      .attr("class", "overlay-bg")
      .attr("width", 0)
      .attr("height", 0);

    container
      .append("text")
      .attr("class", "overlay-title")
      .attr("x", 18)
      .attr("y", 36)
      .text("test");

    container
      .append("text")
      .attr("class", "overlay-caption")
      .attr("x", 18)
      .attr("y", 60)
      .text("Deadliest City");

    this.spikeGroup = this.overlayGroup.append("g").attr("class", "spike-g");
    // .attr("transform", "translate(-40, -40)");

    this.svg
      .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
  }

  onSelect(listener) {
    this._onSelect = listener;
  }

  render() {
    const { svg, statesGroup, nationGroup, overlayGroup, spikeGroup } = this;

    const self = this;

    const data = this.getData();
    const updateStatesAndNation = this.updateStatesAndNation.bind(this);
    const showOverlay = this.showOverlay.bind(this);
    const hideOverlay = this.hideOverlay.bind(this);

    const byState = groupBy(data, "state");
    const maxCount = d3.max(Object.values(byState), (d) => d.length);

    const colorScale = d3
      .scaleSequential(d3.interpolateMagma)
      .domain([0, maxCount]);

    getStates().then(({ states, nation }) => {
      projection.fitExtent(extent, nation[0]);

      svg.on("click", (evt) => {
        evt.preventDefault();

        hideOverlay();

        self._onSelect(null);

        // projection.fitExtent(extent, nation[0]);
        // spikeGroup.selectAll(".spike").attr("visibility", "hidden");
        updateStatesAndNation(colorScale, byState);
      });

      statesGroup
        .selectAll(".state")
        .data(states, (d) => d.id)
        .join("path")
        .classed("state", true)
        .attr("d", path)
        .style("transform-origin", (d) =>
          path
            .centroid(d)
            .map((coord) => `${coord}px`)
            .join(" ")
        )
        .style("fill", (d) =>
          !byState[d.properties.name] || byState[d.properties.name].length === 0
            ? "url(#diag-hatch)"
            : colorScale(
                byState[d.properties.name] && byState[d.properties.name].length
              )
        )
        .style("pointer-events", (d) =>
          !byState[d.properties.name] || byState[d.properties.name].length === 0
            ? "none"
            : "all"
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

          const isSelected = !d3.select(this).classed("selected");
          updateStatesAndNation(colorScale, byState);

          d3.select(this).classed("selected", isSelected);

          self._onSelect(isSelected ? d : null);

          if (isSelected) {
            showOverlay(d, byState[d.properties.name]);

            d3.select(this).raise();
          } else {
            hideOverlay();

            // d3.select(this).lower();
          }
        });

      nationGroup
        .selectAll("path")
        .data(nation)
        .join("path")
        .attr("class", "nation")
        .attr("d", path);

      if (overlayGroup.classed("open")) {
        const selectedEl = statesGroup.select(".selected");
        const selectedState = selectedEl.datum();

        const stateData = byState[selectedState.properties.name];

        if (stateData) {
          showOverlay(selectedState, stateData);
        } else {
          selectedEl.classed("selected", false);
          this._onSelect(null);
          hideOverlay();
        }
      }
    });
  }

  showOverlay(state, allStateData) {
    const { overlayGroup } = this;
    const stateData = groupBy(allStateData, ["lat", "lng"]);
    const byAgeGroup = countBy(allStateData, "ageGroup");
    const byGender = countBy(allStateData, "gender");

    const topCity = Object.values(stateData).sort(
      (a, b) => b.length - a.length
    )[0];

    const boxMargin = 15;
    const topInfoMargin = 100;
    const containerMargin = 40;
    const bounds = path.bounds(state);

    const circleScale = d3
      .scaleLinear()
      .domain([1, d3.max(Object.values(stateData), (d) => d.length)])
      .range([2, 20]);

    const [x, y] = [bounds[0][0] - boxMargin, bounds[0][1] - boxMargin];

    const [width, height] = [
      bounds[1][0] - bounds[0][0] + boxMargin * 2,
      bounds[1][1] - bounds[0][1] + boxMargin * 2,
    ];

    const direction = x + width / 2 > svgWidth / 2 ? "left" : "right";
    const space = [
      Math.min(
        svgWidth / 2 - containerMargin * 2,
        direction === "left"
          ? x - containerMargin * 2
          : svgWidth - (x + width) - containerMargin * 2
      ),
      svgHeight - containerMargin * 2,
    ];

    const stateAspect = width / height;
    const spaceAspect = space[0] / (space[1] - topInfoMargin);

    const [containerWidth, containerHeight] = [
      spaceAspect > stateAspect ? space[1] * stateAspect : space[0],
      spaceAspect < stateAspect ? space[0] / stateAspect : space[1],
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
          direction === "left"
            ? x - containerMargin - containerWidth
            : x + width + containerMargin
        }px, ${containerMargin + (space[1] - containerHeight) / 2}px, 0)`
      );

    overlayGroup
      .select(".overlay-bg")
      .style("opacity", 1)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    const overlayProjection = d3.geoAlbersUsa().fitExtent(
      [
        [boxMargin, boxMargin + topInfoMargin],
        [containerWidth - 2 * boxMargin, containerHeight - 2 * boxMargin],
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
      .select(".overlay-container .overlay-title")
      .text(state.properties.name);

    overlayGroup
      .select(".overlay-container .overlay-caption")
      .text(`Deadliest City: ${topCity[0].city} (${topCity.length})`);

    overlayGroup
      .select(".overlay-container")
      .selectAll(".spike")
      .data(Object.keys(stateData))
      .join("g")
      .each(function (d) {
        const [lat, lng] = d.split("~").map((d) => +d);

        const [x, y] = overlayProjection([lng, lat]);

        d3.select(this)
          .selectAll("circle")
          .data([circleScale(stateData[d].length), 1])
          .join("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", (d) => d)
          .style("fill", (d, i) => ["url(#dot)", "#fb8072"][i]);
      })
      .attr("class", "spike");
  }

  hideOverlay() {
    const { overlayGroup } = this;
    overlayGroup.classed("open", false);

    overlayGroup
      .select(".indicator")
      .style("transform", function () {
        const el = d3.select(this);
        const [
          string,
          x,
          y,
        ] = /translate3d\(([\d\.]*)px,\s*([\d\.]*)px,\s*[\d\.]*px\)/.exec(
          d3.select(this).style("transform")
        );

        const [width, height] = [el.attr("width"), el.attr("height")];

        return `translate3d(${+x + +width / 2}px, ${+y + +height / 2}px, 0)`;
      })
      .attr("width", 0)
      .attr("height", 0);

    overlayGroup.select(".overlay-container");
  }

  updateStatesAndNation(colorScale, byState) {
    const { statesGroup } = this;

    statesGroup
      .selectAll("path")
      .classed("selected", false)
      .style("fill", (d) =>
        !byState[d.properties.name] || byState[d.properties.name].length === 0
          ? "url(#diag-hatch)"
          : colorScale(
              byState[d.properties.name] && byState[d.properties.name].length
            )
      )
      .style("stroke-width", null);
    // nationGroup.selectAll("path");
  }
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
