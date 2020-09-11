let topo = null;
let STATES = null;

const path = d3.geoPath();
const projection = path.projection();

console.log(path.stream);

let statesGroup = null;

export default function render({ svg, width, height }, onSelect) {
  if (!statesGroup) {
    statesGroup = svg
      .append("g")
      .attr("class", "states-g")
      .attr("transform", "translate(40, 40)");
  }

  svg
    .attr("viewBox", "0 0 1000 700")
    .attr("preserveAspectRatio", "xMidYMid meet");

  getStates().then((states) => {
    statesGroup
      .selectAll("path")
      .data(states)
      .join("path")
      .attr("fill", (d) => "#fdc08622")
      .attr("stroke", "#fdc086")
      .attr("stroke-linejoin", "round")
      .attr("d", path)
      .append("title")
      .text((d) => {
        return `${d.properties.name}`;
      });
  });
}

function getStates() {
  return new Promise((resolve, reject) => {
    if (!topo || !STATES) {
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@2/us/10m.json")
        .then((us) => {
          topo = us;

          STATES = topojson.feature(us, us.objects.states, (a, b) => a !== b)
            .features;

          resolve(STATES);
        })
        .catch(reject);
    } else {
      resolve(STATES);
    }
  });
}
