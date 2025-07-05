fetch("https://mygenai-bt8x.onrender.com/data")
  .then(res => res.json())
  .then(jsonld => {
    const triples = [];

    jsonld.forEach(entity => {
      const subject = entity["@id"]?.split("#").pop() || "Unknown";

      for (const [predicate, values] of Object.entries(entity)) {
        if (predicate.startsWith("@")) continue;

        const pred = predicate.split("/").pop();

        if (Array.isArray(values)) {
          values.forEach(value => {
            const object = value["@id"]
              ? value["@id"].split("#").pop()
              : value["@value"];
            triples.push({ subject, predicate: pred, object });
          });
        }
      }
    });

    console.log("✅ Triples loaded:", triples);
    const graph = triplesToGraph(triples);
    renderGraph(graph);
  })
  .catch(error => {
    console.error("❌ Failed to fetch RDF data:", error);
  });

function triplesToGraph(triples) {
  const nodes = {};
  const links = [];

  triples.forEach(({ subject, predicate, object }) => {
    if (!nodes[subject]) nodes[subject] = { id: subject };
    if (!nodes[object]) nodes[object] = { id: object };
    links.push({ source: subject, target: object, label: predicate });
  });

  return {
    nodes: Object.values(nodes),
    links
  };
}

function renderGraph(graph) {
  const svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

  const simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink(graph.links).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg.append("g")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
    .attr("class", "link");

  const node = svg.append("g")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 10)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  const label = svg.append("g")
    .selectAll("text")
    .data(graph.nodes)
    .enter().append("text")
    .text(d => d.id)
    .attr("x", 12)
    .attr("y", ".31em");

  const edgeLabel = svg.append("g")
    .selectAll("text")
    .data(graph.links)
    .enter().append("text")
    .text(d => d.label)
    .attr("fill", "#555");

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x).attr("cy", d => d.y);

    label
      .attr("x", d => d.x + 12).attr("y", d => d.y);

    edgeLabel
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2);
  });

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}
