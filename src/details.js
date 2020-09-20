import BaseView from "./view.js";
import { groupBy } from "./util/data-utils.js";

export default class DetailsView extends BaseView {}

// export default function render({ svg, width, height }, data, onSelect) {
//   const byState = groupBy(data, "state");
//   console.log(byState);
// }
