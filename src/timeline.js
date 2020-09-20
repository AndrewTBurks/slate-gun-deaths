import BaseView from "./view.js";
import { groupBy } from "./util/data-utils.js";

const MARGIN = {
  left: 30,
  top: 40,
  bottom: 30,
  right: 15,
};

export default class TimelineView extends BaseView {
  _onSelect = (dateRange) => {};

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
      .range([
        MARGIN.left + barWidth / 2 + 2,
        width - MARGIN.right - barWidth / 2 - 2,
      ]);

    const xAxis = d3.axisBottom(xScale);

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
              `translate3d(${Math.max(selection[0], 80)}px, ${MARGIN.top}px, 0)`
            )
            .select("text")
            .text(dateRange[0].toLocaleDateString());

          svg
            .select("#date-end")
            .style(
              "transform",
              `translate3d(${Math.min(selection[1], width - 80)}px, ${
                MARGIN.top
              }px, 0)`
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

    svg.selectAll("*").remove();

    svg.attr("shape-rendering", "geometricPrecision");

    svg
      .selectAll(".date-bar")
      .data(Object.values(byDay))
      .join("rect")
      .attr("class", "date-bar")
      .attr("x", (d) => xScale(d[0].date) - barWidth / 2)
      .attr("width", barWidth)
      .attr("y", (d) => yScale(d.length))
      .attr("height", (d) => height - MARGIN.bottom - yScale(d.length))
      .style("fill", "#FED7D7");

    updateBars(null);
    this._onSelect(null);

    svg
      .append("g")
      .attr("class", "x-axis")
      .style("color", "#aaa")
      .style("transform", `translate3d(0, ${height - MARGIN.bottom}px, 0)`)
      .call(xAxis);

    svg
      .append("g")
      .attr("class", "y-axis")
      .style("color", "#aaa")
      .style("transform", `translate3d(${MARGIN.left}px, 0, 0)`)
      .call(yAxis);

    svg.append("g").attr("class", "x-brush").style("color", "#aaa").call(brush);

    const startLabel = svg
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

    const endLabel = svg
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
    this.svg.selectAll(".date-bar").style("fill", (d) => {
      const date = d[0].date;

      if (!dateRange) {
        return "#FEB2B2";
      } else if (
        date.getTime() > dateRange[0].getTime() &&
        date.getTime() < dateRange[1].getTime()
      ) {
        return "#FC8181";
      } else {
        return "#A0AEC0";
      }
    });
  }

  onSelect(listener) {
    this._onSelect = listener;
  }
}
