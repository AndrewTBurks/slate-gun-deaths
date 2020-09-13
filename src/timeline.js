import { groupBy } from "./util/data-utils.js";

const MARGIN = {
  left: 30,
  top: 15,
  bottom: 30,
  right: 15,
};

export default function render({ svg, width, height }, data, onSelect) {
  const byDay = groupBy(data, (d) => d.date.toLocaleDateString());
  console.log(byDay);

  const chartWidth = width - MARGIN.left - MARGIN.right;
  const barWidth = chartWidth / Object.keys(byDay).length - 1;

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(Object.keys(byDay).map((d) => new Date(d))))
    .range([
      MARGIN.left + barWidth / 2 + 2,
      width - MARGIN.right - barWidth / 2 - 2,
    ]);

  const xAxis = d3.axisBottom(xScale);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(Object.values(byDay), (d) => d.length)])
    .range([height - MARGIN.bottom, MARGIN.top]);

  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg.selectAll("*").remove();

  svg.attr("shape-rendering", "geometricPrecision");

  svg
    .selectAll(".date-bar")
    .data(Object.keys(byDay))
    .join("rect")
    .attr("x", (d) => xScale(byDay[d][0].date) - barWidth / 2)
    .attr("width", barWidth)
    .attr("y", (d) => yScale(byDay[d].length))
    .attr("height", (d) => height - MARGIN.bottom - yScale(byDay[d].length))
    .style("fill", "#444");

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
}
