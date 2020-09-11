import renderMap from "./map.js";
import createSvg from "./util/create-svg.js";

createSvg(".map", (info) => renderMap(info, (...args) => console.log(args)));
createSvg(".timeline", console.log);
createSvg(".stats", console.log);
