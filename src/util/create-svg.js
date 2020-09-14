const CONTAINER_PADDING = 16;
const SVGS = [];

let timeout = null;

window.onresize = function () {
  timeout && clearTimeout(timeout);
  timeout = this.setTimeout(() => {
    SVGS.forEach(({ container, svg, then }) => {
      then && then({ svg, ...sizeSVG(container, svg) });
    });

    timeout = null;
  }, 100);
};

function sizeSVG(container, svg) {
  const width = container.node().clientWidth - CONTAINER_PADDING;
  const height = container.node().clientHeight - CONTAINER_PADDING;
  svg.attr("width", width).attr("height", height);

  return { width, height };
}

export default function createSvg(elem, init, then) {
  const container = d3.select(elem);

  const svg = container
    .append("svg")
    .attr("shape-rendering", "geometricPrecision");

  init && init({ svg, ...sizeSVG(container, svg) });
  then && then({ svg, ...sizeSVG(container, svg) });

  SVGS.push({ container, svg, then });
}
