import BaseView from "./view.js";
import { groupBy, countBy, remapKeys, normalize } from "./util/data-utils.js";

const charts = {
  "Age Group": {
    counter: "ageGroup",
    domain: [0, 1, 2, 3],
    keyMap: ["Unknown", "Child (0-12)", "Teen (13-17)", "Adult (18+)"],
  },
  Gender: {
    counter: "gender",
    domain: ["M", "F", ""],
    keyMap: { M: "Male", F: "Female", "": "Other" },
  },
  "Day of Week": {
    counter: (d) => d.date.getDay(),
    keyMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
};

const PADDING = {
  top: 120,
  bottom: 0,
  left: 0,
  right: 0,
};

export default class DetailsView extends BaseView {
  init() {
    this.svg
      .append("text")
      .attr("class", "view-title")
      .attr("x", 0)
      .attr("y", 24)
      .text("Distrubtion for");

    const legend = this.svg
      .append("g")
      .attr("class", "legend-g")
      .attr("transform", "translate(8, 30)");

    const nationalLegend = legend
      .append("g")
      .attr("id", "national-legend")
      .attr("transform", "translate(0, 0)");

    nationalLegend
      .append("path")
      .attr("class", "data-line national")
      .attr("d", "M 0 15 l 40 0");

    nationalLegend
      .append("circle")
      .attr("class", "data-dot national")
      .attr("cx", 20)
      .attr("cy", 15);

    nationalLegend
      .append("text")
      .attr("x", 54)
      .attr("y", 20)
      .attr("font-size", 16)
      .attr("font-weight", 300)
      .text("National");

    const filteredLegend = legend
      .append("g")
      .attr("id", "time-legend")
      .attr("transform", "translate(0, 28)");

    filteredLegend
      .append("path")
      .attr("class", "data-line selected-time")
      .attr("d", "M 0 15 l 40 0");

    filteredLegend
      .append("circle")
      .attr("class", "data-dot selected-time")
      .attr("cx", 20)
      .attr("cy", 15);

    filteredLegend
      .append("text")
      .attr("x", 54)
      .attr("y", 20)
      .attr("font-size", 16)
      .attr("font-weight", 300)
      .text("Selected Time Range");

    const stateLegend = legend
      .append("g")
      .attr("id", "state-legend")
      .attr("transform", "translate(0, 56)");

    stateLegend
      .append("rect")
      .attr("class", "data-bar")
      .attr("x", 5)
      .attr("y", 6)
      .attr("width", 30)
      .attr("height", 16);

    stateLegend
      .append("text")
      .attr("x", 54)
      .attr("y", 20)
      .attr("font-size", 16)
      .attr("font-weight", 300)
      .text("Selected State");
  }

  render() {
    const { all, time, state } = this.getData();

    const smallChartHeight =
      (this.height - PADDING.top - PADDING.bottom) / Object.keys(charts).length;

    this.svg
      .selectAll(".small-chart")
      .data(Object.entries(charts))
      .join("g")
      .attr("class", "small-chart")
      .style(
        "transform",
        (d, i, set) =>
          `translate3d(0, ${PADDING.top + i * smallChartHeight}px, 0)`
      )
      .call(
        multiSeriesChart,
        { width: this.width, height: smallChartHeight },
        { all, time, state }
      );

    this.svg.select("#national-legend text").text(`National (${all.length})`);
    this.svg.select("#time-legend text").text(`Selected Time (${time.length})`);

    if (!state || !state.length) {
      this.svg
        .select("#state-legend text")
        .attr("font-style", "italic")
        .text("Select a state from the map...");
    } else {
      this.svg
        .select("#state-legend text")
        .attr("font-style", "normal")
        .text(`${state[0].state} (${state.length})`);
    }
  }
}

// export default function render({ svg, width, height }, data, onSelect) {
//   const byState = groupBy(data, "state");
//   console.log(byState);
// }

const MARGIN = {
  top: 32,
  bottom: 25,
  left: 40,
  right: 10,
};

function multiSeriesChart(selection, { width, height }, { all, time, state }) {
  selection.each(function (d) {
    const miniChart = d3.select(this);
    miniChart;
    const [label, { counter, domain, keyMap }] = d;

    const allCount = normalize(remapKeys(countBy(all, counter), keyMap));
    const filteredCount = normalize(remapKeys(countBy(time, counter), keyMap));
    const stateCount =
      (state && normalize(remapKeys(countBy(state, counter), keyMap))) || null;

    miniChart
      .selectAll(".small-chart-title")
      .data([null])
      .join("text")
      .attr("class", "small-chart-title")
      .attr("x", 0)
      .attr("y", 18)
      .style("font-size", 16)
      .style("font-weight", 300)
      .text(label);

    const xScale = d3
      .scaleBand()
      .domain(Object.values(keyMap))
      .range([MARGIN.left, width - MARGIN.right])
      .paddingInner(0.2)
      .paddingOuter(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max([
          ...Object.values(allCount),
          ...Object.values(filteredCount),
          ...((stateCount && Object.values(stateCount)) || []),
        ]),
      ])
      .range([height - MARGIN.bottom, MARGIN.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".1~%")).ticks(6);

    const line = d3
      .line(([x]) => xScale(x) + xScale.bandwidth() / 2)
      .y(([, y]) => yScale(y))
      .curve(d3.curveMonotoneX);

    miniChart
      .selectAll(".state-series")
      .data([stateCount])
      .join("g")
      .attr("class", "state-series")
      .each(function (d) {
        d3.select(this)
          .selectAll(".data-bar")
          .data(
            (d && Object.values(keyMap).map((key) => [key, d[key] || 0])) || []
          )
          .join("rect")
          .attr("class", "data-bar")
          .attr("x", ([x]) => xScale(x))
          .attr("width", xScale.bandwidth())
          .transition()
          .attr("y", ([, y]) => yScale(y))
          .attr("height", ([, y]) => height - MARGIN.bottom - yScale(y));
      });

    miniChart
      .selectAll(".data-series")
      .data([allCount, filteredCount])
      .join("g")
      .attr("class", "data-series")
      .each(function (d, i) {
        const dataEntries =
          (d && Object.values(keyMap).map((key) => [key, d[key] || 0])) || [];

        d3.select(this)
          .selectAll(".data-line")
          .data([dataEntries])
          .join("path")
          .attr("class", "data-line " + (i ? "selected-time" : "national"))
          .attr("d", line);

        d3.select(this)
          .selectAll(".data-dot")
          .data(dataEntries)
          .join("circle")
          .attr("class", "data-dot " + (i ? "selected-time" : "national"))
          .attr("cx", ([x]) => xScale(x) + xScale.bandwidth() / 2)
          .attr("cy", ([, y]) => yScale(y))
          .attr("r", 6);
      });

    miniChart
      .selectAll(".x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .style("transform", `translate3d(0, ${height - MARGIN.bottom}px, 0)`)
      .call(xAxis);

    miniChart
      .selectAll(".y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .style("transform", `translate3d(${MARGIN.left}px, 0, 0)`)
      .call(yAxis);
  });
}
