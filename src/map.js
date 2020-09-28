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

let currentScale = "count";

const scales = {
  count(data) {
    return d3
      .scaleSequential(d3.interpolateMagma)
      .domain([1, d3.max(Object.values(data), (d) => d.length)]);
  },
  gender(data) {
    return d3
      .scaleSequential(
        d3.piecewise(d3.interpolateLab, [
          "#F687B3",
          "#FBB6CE",
          "#FED7E2",
          "#FFF5F7",
          "#ffffff",
          "#EBF4FF",
          "#C3DAFE",
          "#A3BFFA",
          "#7F9CF5",
        ])
      )
      .domain([0, 1]);
  },
  age(data) {
    return d3.scaleSequential(d3.interpolateBuPu).domain([100, 0]);
  },
};

const getScaleInput = {
  count(data) {
    return data.length;
  },
  gender(data) {
    const count = countBy(data, "gender");

    return (count.M ?? 0) / count.__total__;
  },
  age(data) {
    return d3.mean(data, (d) => d.age);
  },
};

const getScaleLabels = {
  count(domain) {
    return d3
      .range(7)
      .map((i) => (domain[0] + (i * (domain[1] - domain[0])) / 6).toFixed());
  },
  gender() {
    return ["100% F", "", "", "Equal", "", "", "100% M"];
  },
  age(domain) {
    return d3.range(7).map((i) => (domain[1] + (i * domain[0]) / 6).toFixed(1));
  },
};

export default class DetailsView extends BaseView {
  _onSelect = () => null;
  statesGroup = null;
  nationGroup = null;

  overlayGroup = null;
  spikeGroup = null;

  init() {
    const defs = this.svg.append("defs");

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

    container
      .append("g")
      .style("transform", "translate3d(14px, 70px, 0)")
      .each(function () {
        // d3.select(this)
        //   .append("rect")
        //   .classed("bg-rect", true)
        //   .attr("stroke", "white")
        //   .attr("width", 0)
        //   .attr("height", 24)
        //   .attr("y", 0);

        d3.select(this)
          .append("text")
          .attr("x", 40)
          .style("text-anchor", "middle")
          .attr("y", 18)
          .attr("font-size", 14)
          .attr("font-weight", 300)
          .text("Gender");

        d3.select(this)
          .append("g")
          .attr("class", ".gender-bars-g")
          .style("transform", "translate(125px, 0)")
          .each(function () {
            d3.select(this)
              .append("rect")
              .attr("class", "gender-bar-m")
              .attr("width", 75)
              .attr("height", 16)
              .attr("y", 4)
              .attr("fill", "#90CDF4");
            d3.select(this)
              .append("rect")
              .attr("class", "gender-bar-f")
              .attr("width", 75)
              .attr("x", 75)
              .attr("height", 16)
              .attr("y", 4)
              .attr("fill", "#FBB6CE");

            d3.select(this)
              .append("text")
              .attr("class", "gender-label-m")
              .attr("font-size", 12)
              .style("fill", "#a0aec0")
              .attr("x", -4)
              .attr("y", 16)
              .attr("text-anchor", "end")
              .text("50% M");

            d3.select(this)
              .append("text")
              .attr("class", "gender-label-f")
              .attr("font-size", 12)
              .style("fill", "#a0aec0")
              .attr("y", 16)
              .attr("x", 154)
              .text("50% F");
          });
      })
      .classed("gender-chart", true);

    container
      .append("g")
      .style("transform", "translate3d(14px, 102px, 0)")
      .each(function () {
        d3.select(this)
          .append("text")
          .attr("x", 40)
          .style("text-anchor", "middle")
          .attr("y", 18)
          .attr("font-size", 14)
          .attr("font-weight", 300)
          .text("Age");

        d3.select(this)
          .append("g")
          .attr("class", ".age-chart-g")
          .style("transform", "translate(125px, 0)")
          .each(function (d) {
            // .append("rect")
            // .classed("age-bars-bg", true)
            // .attr("stroke", "white")
            // .attr("width", 150)
            // .attr("height", 24)
            // .attr("y", 0);

            // d3.select(this)
            //   .append("line")
            //   .classed("age-y-axis", true)
            //   .attr("stroke", "#a0aec0")
            //   .attr("stroke-width", 0.5)
            //   .attr("x1", 0)
            //   .attr("x1", 0)
            //   .attr("y1", 0)
            //   .attr("y2", 24);

            d3.select(this)
              .append("text")
              .classed("age-scale-0", true)
              .style("fill", "#a0aec0")
              .attr("text-anchor", "end")
              .attr("font-size", 12)
              .attr("x", -4)
              .attr("y", 24)
              .text("0");

            d3.select(this)
              .append("text")
              .classed("age-max-y", true)
              .style("fill", "#a0aec0")
              .attr("text-anchor", "end")
              .attr("font-size", 12)
              .attr("x", -4)
              .attr("y", 8)
              .text("100");

            d3.select(this)
              .append("text")
              .classed("age-y-label", true)
              .style("fill", "#a0aec0")
              .attr("text-anchor", "end")
              .attr("font-size", 14)
              .attr("x", -24)
              .attr("y", 16)
              .text("#");

            d3.select(this)
              .append("text")
              .classed("age-max-x", true)
              .style("fill", "#a0aec0")
              .attr("text-anchor", "start")
              .attr("font-size", 12)
              .attr("x", 154)
              .attr("y", 24)
              .text("100 yrs");

            d3.select(this)
              .append("path")
              .attr("class", "sparkline")
              .attr("stroke", "#F56565")
              .attr("stroke-width", 0.5)
              .attr("fill", "url(#sparkline-fill)");

            d3.select(this)
              .append("line")
              .classed("age-x-axis", true)
              .attr("stroke", "#a0aec0")
              .attr("stroke-width", 1)
              .attr("x1", 0)
              .attr("x1", 150)
              .attr("y1", 24)
              .attr("y2", 24);
          });
      })
      .classed("age-chart", true);

    this.svg
      .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    this.legendG = this.svg.append("g").attr("transform", "translate(0, 120)");

    d3.select(".map select").on("change", (e) => {
      currentScale = e.target.value;

      this.render();
    });

    this.legendG
      .append("rect")
      .attr("width", 160)
      .attr("height", 240)
      .attr("fill", "var(--background)")
      .attr("fill-opacity", 0.5)
      .attr("rx", 12);

    this.legendG
      .append("text")
      .attr("x", 80)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .text("Legend")
      .attr("font-size", 14)
      .attr("font-weight", 300);

    this.legendG
      .append("text")
      .attr("x", 40)
      .attr("y", 42)
      .attr("text-anchor", "middle")
      .style("filter", "url(#drop-shadow)")
      .text("State")
      .attr("font-size", 14)
      .attr("font-weight", 600);

    this.legendG
      .append("g")
      .classed("state-g", true)
      .attr("transform", "translate(40, 52)")
      .selectAll(".swatch")
      .data(d3.range(7))
      .join("g")
      .classed("swatch", true)
      .attr("transform", (d) => `translate(0, ${(6 - d) * 22})`)
      .each(function (d) {
        d3.select(this)
          .append("rect")
          .attr("x", -30)
          .attr("width", 60)
          .attr("height", 22)
          .attr("fill", scales.age()(d * 10));

        d3.select(this)
          .append("text")
          .attr("y", 16)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("filter", "url(#drop-shadow)")
          .style("text-shadow", "0 0 1px #000c")
          .style("font-size", 14)
          .attr("font-weight", 700)
          .text(d);
      });

    this.legendG
      .select(".state-g")
      .append("g")
      .classed("swatch-none", true)
      .attr("transform", (d) => `translate(0, ${7 * 22})`)
      .each(function (d) {
        d3.select(this)
          .append("rect")
          .attr("x", -30)
          .attr("width", 60)
          .attr("height", 22)
          .attr("fill", "var(--background)");

        d3.select(this)
          .append("rect")
          .attr("x", -30)
          .attr("width", 60)
          .attr("height", 22)
          .style("fill", "url(#diag-hatch)")
          .style("stroke", "#718096")
          .style("stroke-width", 0.5);

        d3.select(this)
          .append("text")
          .attr("y", 18)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .style("filter", "url(#drop-shadow)")
          .style("text-shadow", "0 0 1px #000c")
          .style("font-size", 16)
          .attr("font-weight", 700)
          .text("∅");
      });

    this.legendG
      .append("text")
      .attr("x", 120)
      .attr("y", 42)
      .attr("text-anchor", "middle")
      .style("filter", "url(#drop-shadow)")
      .text("City")
      .attr("font-size", 14)
      .attr("font-weight", 600);

    this.legendG
      .append("g")
      .classed("city-g", true)
      .style("opacity", 0)
      .attr("transform", "translate(128, 58)")
      .selectAll(".circle-swatch")
      .data(d3.range(5))
      .join("g")
      .classed("circle-swatch", true)
      .attr("transform", (d) => `translate(0, ${(4 - d) * 36})`)
      .each(function (d) {
        d3.select(this)
          .selectAll("circle")
          .data([1 + (d * 15) / 4, 1])
          .join("circle")
          .attr("cx", 10)
          .attr("cy", 11)
          .attr("r", (d) => d)
          .attr("fill", (d, i) => ["url(#dot)", "#fb8072"][i]);

        d3.select(this)
          .append("text")
          .attr("x", -12)
          .attr("y", 16)
          .attr("text-anchor", "end")
          .attr("fill", "white")
          .style("filter", "url(#drop-shadow)")
          .style("text-shadow", "0 0 1px #000c")
          .style("font-size", 14)
          .attr("font-weight", 700)
          .text(d);
      });
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

    const colorScale = scales[currentScale](byState);
    const colorDomain = colorScale.domain();
    const legendPoints = d3
      .range(7)
      .map((i) => d3.min(colorDomain) + (i * d3.max(colorDomain)) / 6);

    console.log(legendPoints);

    const legendLabels = getScaleLabels[currentScale](colorScale.domain());

    const swatches = this.legendG.select(".state-g").selectAll(".swatch");

    swatches.select("rect").attr("fill", (d) => colorScale(legendPoints[d]));
    swatches.select("text").text((d) => legendLabels[d]);

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
        .style("fill", (d) => {
          if (
            !byState[d.properties.name] ||
            byState[d.properties.name].length === 0
          ) {
            return "url(#diag-hatch)";
          } else {
            return colorScale(
              getScaleInput[currentScale](byState[d.properties.name])
            );
          }
        })
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
    const byAge = countBy(allStateData, "age");
    const byGender = countBy(allStateData, "gender");

    const topCity = Object.values(stateData).sort(
      (a, b) => b.length - a.length
    )[0];

    const boxMargin = 15;
    const topInfoMargin = 128;
    const containerMargin = 40;
    const leftMargin = 180;
    const bounds = path.bounds(state);

    const circleScale = d3
      .scaleLinear()
      .domain([1, d3.max(Object.values(stateData), (d) => d.length)])
      .range([1, 15]);

    const circleDomain = circleScale.domain();
    const circleValues = d3
      .range(5)
      .map((i) =>
        (
          circleDomain[0] +
          (i * (circleDomain[1] - circleDomain[0])) / 4
        ).toFixed()
      );

    this.legendG.selectAll(".city-g").style("opacity", 1);

    const swatches = this.legendG.select(".city-g").selectAll(".circle-swatch");

    swatches.select("text").text((d) => circleValues[d]);

    const [x, y] = [bounds[0][0] - boxMargin, bounds[0][1] - boxMargin];

    const [width, height] = [
      bounds[1][0] - bounds[0][0] + boxMargin * 2,
      bounds[1][1] - bounds[0][1] + boxMargin * 2,
    ];

    const direction =
      x + width / 2 > (svgWidth + leftMargin + containerMargin) / 2
        ? "left"
        : "right";
    const space = [
      Math.min(
        0.4 * svgWidth - 2 * containerMargin,
        direction === "left"
          ? x - containerMargin - leftMargin
          : svgWidth - (x + width) - containerMargin * 2
      ),
      0.9 * svgHeight - containerMargin * 2,
    ];

    const stateAspect = width / height;
    const spaceAspect = space[0] / (space[1] - topInfoMargin);

    const [containerWidth, containerHeight] = [
      spaceAspect > stateAspect ? space[1] * stateAspect : space[0],
      spaceAspect < stateAspect
        ? space[0] / stateAspect + topInfoMargin
        : space[1],
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
      .text(`${state.properties.name} - ${allStateData.length} Deaths`);

    overlayGroup
      .select(".overlay-container .overlay-caption")
      .text(`Deadliest City: ${topCity[0].city} (${topCity.length})`);

    overlayGroup.selectAll(".bg-rect").attr("width", containerWidth - 28);

    overlayGroup.selectAll(".gender-chart").each(function () {
      const chart = d3.select(this);

      const totalWidth = 150;
      const percentMale = (byGender.M || 0) / byGender.__total__;
      const percentFemale = (byGender.F || 0) / byGender.__total__;

      const widthMale = totalWidth * percentMale;

      // gender-bar gender-label
      chart
        .select(".gender-label-m")
        .text(`${(percentMale * 100).toFixed()}% M`);
      chart
        .select(".gender-label-f")
        .text(`${(percentFemale * 100).toFixed()}% F`);

      chart.select(".gender-bar-m").attr("width", widthMale);
      chart
        .select(".gender-bar-f")
        .attr("x", widthMale)
        .attr("width", totalWidth - widthMale);
    });

    overlayGroup.selectAll(".age-chart").each(function () {
      const chart = d3.select(this);

      const { 0: none, ...ages } = byAge;

      const yMax = d3.max(Object.values(ages));

      const totalWidth = 150;
      const totalHeight = 24;
      const line = d3
        .line()
        .x((d) => (totalWidth * d) / 100)
        .y((d) => totalHeight - (totalHeight * (ages[d] || 0)) / yMax);

      chart.select(".age-max-y").text(yMax);
      chart
        .select(".sparkline")
        .data([d3.range(1, 100)])
        .join("path")
        .attr("d", (d) => line(d));
    });

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
          .attr("fill", (d, i) => ["url(#dot)", "#fb8072"][i])
          .selectAll("title")
          .data([null])
          .join("title")
          .text(`${stateData[d][0].city}: ${stateData[d].length}`);
      })
      .attr("class", "spike");
  }

  hideOverlay() {
    const { overlayGroup } = this;
    overlayGroup.classed("open", false);
    this.legendG.select(".city-g").style("opacity", 0);

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
      .style("fill", (d) => {
        if (
          !byState[d.properties.name] ||
          byState[d.properties.name].length === 0
        ) {
          return "url(#diag-hatch)";
        } else {
          return colorScale(
            getScaleInput[currentScale](byState[d.properties.name])
          );
        }
      })
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
