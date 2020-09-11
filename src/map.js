let topo = null;
let STATES = null;
let NATION = null;

const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
const path = d3.geoPath(projection);

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

  getStates().then(({ states, nation }) => {
    console.log(states);

    statesGroup
      .selectAll("path")
      .data(states)
      .join("path")
      .attr("class", "state")
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
      resolve(STATES);
    }
  });
}
