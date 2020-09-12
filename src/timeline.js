import { groupBy } from "./util/data-utils.js";

export default function render({ svg, width, height }, data, onSelect) {
  const byDay = groupBy(data, (d) => d.date.toLocaleDateString());
  console.log(byDay);
}
