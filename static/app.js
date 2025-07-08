function runQuery() {
  const query = document.getElementById("query").value;
  fetch("/sparql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      document.getElementById("results").textContent = "Error: " + data.error;
      return;
    }
    document.getElementById("results").textContent = JSON.stringify(data, null, 2);
    drawGraph(data);
    drawMap(data); // ✅ Now correctly placed inside runQuery
  });
}

function drawGraph(data) {
  const svg = d3.select("svg");
  svg.selectAll("*").remove();

  const nodes = new Map();
  const links = [];

  data.forEach(row => {
    if (row.length >= 2) {
      const [source, target] = row;
      nodes.set(source, { id: source });
      nodes.set(target, { id: target });
      links.push({ source, target });
    }
  });

  const nodeArray = Array.from(nodes.values());

  const simulation = d3.forceSimulation(nodeArray)
    .force("link", d3.forceLink(links).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(400, 250));

  svg.selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke", "#999");

  const node = svg.selectAll("circle")
    .data(nodeArray)
    .enter().append("circle")
    .attr("r", 10)
    .attr("fill", "#69b3a2");

  const label = svg.selectAll("text")
    .data(nodeArray)
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

function drawMap(data) {
  const map = L.map('map').setView([10.0, 78.0], 6); // Centered on Tamil Nadu

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  data.forEach(row => {
    const lat = parseFloat(row.find(v => v.includes("9.")));
    const lon = parseFloat(row.find(v => v.includes("78.")));
    const label = row.find(v => !v.includes("http") && isNaN(v));
    if (!isNaN(lat) && !isNaN(lon)) {
      L.marker([lat, lon]).addTo(map).bindPopup(label);
    }
  });
}
