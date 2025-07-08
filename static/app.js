function buildQuery() {
  const type = document.getElementById("type").value;
  const query = `
SELECT ?name ?location ?lat ?long WHERE {
  ?s a <http://schema.org/${type}> ;
     <http://schema.org/name> ?name ;
     <http://schema.org/location> ?location ;
     <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat ;
     <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?long .
}`;
  document.getElementById("query").value = query.trim();
}

function runQuery() {
  const query = document.getElementById("query").value;
  fetch("/sparql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("results").textContent = JSON.stringify(data, null, 2);
    drawMap(data);
    drawGraph(data);
  });
}

function drawMap(data) {
  const map = L.map('map').setView([10.0, 78.0], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  data.forEach(([name, location, lat, long]) => {
    if (!isNaN(lat) && !isNaN(long)) {
      L.marker([parseFloat(lat), parseFloat(long)])
        .addTo(map)
        .bindPopup(`<b>${name}</b><br>${location}`);
    }
  });
}

function drawGraph(data) {
  const svg = d3.select("svg");
  svg.selectAll("*").remove();

  const nodes = [], links = [];
  data.forEach(([name, location]) => {
    nodes.push({ id: name });
    nodes.push({ id: location });
    links.push({ source: name, target: location });
  });

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(400, 300));

  svg.selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke", "#999");

  const node = svg.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("r", 10)
    .attr("fill", "#69b3a2");

  const label = svg.selectAll("text")
    .data(nodes)
    .enter().append("text")
    .text(d => d.id)
    .attr("x", 12)
    .attr("y", ".31em");

  simulation.on("tick", () => {
    svg.selectAll("line")
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("cx", d => d.x).attr("cy", d => d.y);
    label.attr("x", d => d.x + 12).attr("y", d => d.y);
  });
}
