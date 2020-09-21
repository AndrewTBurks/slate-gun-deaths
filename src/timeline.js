import BaseView from "./view.js";
import { groupBy } from "./util/data-utils.js";

const MARGIN = {
  left: 30,
  top: 48,
  bottom: 20,
  right: 15,
};

export default class TimelineView extends BaseView {
  _onSelect = (dateRange) => {};

  init() {
    this.svg
      .append("text")
      .attr("class", "view-title")
      .attr("x", 0)
      .attr("y", 24)
      .text("Deaths Over Time");

    this.chart = this.svg.append("g");
  }

  render() {
    const { svg, width, height } = this;
    const data = this.getData();
    const updateBars = this.updateBars.bind(this);

    const byDay = groupBy(data, (d) => d.date.toLocaleDateString());

    const chartWidth = width - MARGIN.left - MARGIN.right;
    const barWidth = chartWidth / Object.keys(byDay).length - 2;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(Object.keys(byDay).map((d) => new Date(d))))
      .range([MARGIN.left, width - MARGIN.right]);

    const xAxis = d3.axisBottom(xScale);

    const line = d3
      .line()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d[0].date))
      .y((d) => yScale(d.length));

    const brush = d3
      .brushX(xAxis)
      .extent([
        [MARGIN.left, MARGIN.top],
        [width - MARGIN.right, height - MARGIN.bottom],
      ])
      .on("brush", ({ selection }) => {
        const dateRange = selection && selection.map(xScale.invert);
        updateBars(dateRange);

        if (selection) {
          svg.selectAll("#date-start, #date-end").attr("visibility", "visible");

          svg
            .select("#date-start")
            .style(
              "transform",
              `translate3d(${Math.min(
                Math.max(selection[0], 80),
                width - 85
              )}px, ${MARGIN.top}px, 0)`
            )
            .select("text")
            .text(dateRange[0].toLocaleDateString());

          svg
            .select("#date-end")
            .style(
              "transform",
              `translate3d(${Math.max(
                Math.min(selection[1], width - 80),
                85
              )}px, ${MARGIN.top}px, 0)`
            )
            .select("text")
            .text(dateRange[1].toLocaleDateString());
        }
      })
      .on("end", ({ selection }) => {
        const dateRange = selection && selection.map(xScale.invert);
        updateBars(dateRange);
        this._onSelect(dateRange);

        if (selection) {
          svg.selectAll("#date-start, #date-end").attr("visibility", "visible");
        } else {
          svg.selectAll("#date-start, #date-end").attr("visibility", "hidden");
        }
      });

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(Object.values(byDay), (d) => d.length)])
      .range([height - MARGIN.bottom, MARGIN.top]);

    const yAxis = d3.axisLeft(yScale).ticks(5);

    this.chart.selectAll("*").remove();

    this.chart.attr("shape-rendering", "geometricPrecision");

    this.chart
      .append("path")
      .attr("class", "death-line")
      .datum(Object.values(byDay))
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#FEB2B2")
      .attr("stroke-width", 0.5);

    this.chart
      .selectAll(".date-bar")
      .data(Object.values(byDay))
      .join("circle")
      .attr("class", "date-bar")
      .attr("cx", (d) => xScale(d[0].date))
      // .attr("width", barWidth)
      .attr("cy", (d) => yScale(d.length))
      // .attr("height", (d) => height - MARGIN.bottom - yScale(d.length))
      .attr("r", 1.5)
      .style("fill", "#FED7D7");

    updateBars(null);
    this._onSelect(null);

    this.chart
      .append("g")
      .attr("class", "x-axis")
      .style("transform", `translate3d(0, ${height - MARGIN.bottom}px, 0)`)
      .call(xAxis);

    this.chart
      .append("g")
      .attr("class", "y-axis")
      .style("transform", `translate3d(${MARGIN.left}px, 0, 0)`)
      .call(yAxis);

    this.chart
      .append("g")
      .attr("class", "x-brush")
      .style("color", "#aaa")
      .call(brush);

    const startLabel = this.chart
      .append("g")
      .attr("class", "date-label")
      .attr("id", "date-start");

    startLabel
      .append("rect")
      .attr("width", 80)
      .attr("height", 18)
      .attr("x", -80)
      .attr("y", -18)
      .attr("rx", 4);

    startLabel.append("text").attr("x", -40).attr("y", -5).text("startLabel");

    const endLabel = this.chart
      .append("g")
      .attr("class", "date-label")
      .attr("id", "date-end");

    endLabel
      .append("rect")
      .attr("width", 80)
      .attr("height", 18)
      .attr("y", -18)
      .attr("rx", 4);

    endLabel.append("text").attr("x", 40).attr("y", -5).text("endLabel");
  }

  updateBars(dateRange) {
    this.svg
      .select(".death-line")
      .attr("stroke", dateRange ? "#4A5568" : "#FED7D7");

    this.svg.selectAll(".date-bar").each(function (d) {
      const date = d[0].date;

      const withinRange =
        dateRange &&
        date.getTime() >= dateRange[0].getTime() &&
        date.getTime() <= dateRange[1].getTime();

      const fill = !dateRange ? "#FEB2B2" : withinRange ? "#FC8181" : "#4A5568";

      const r = !dateRange ? 1.25 : withinRange ? 2.25 : 0.75;

      d3.select(this).style("fill", fill);
    });
  }

  onSelect(listener) {
    this._onSelect = listener;
  }
}
