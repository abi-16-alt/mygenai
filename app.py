from flask import Flask, render_template, request, jsonify
from rdflib import Graph

app = Flask(__name__)
g = Graph()
g.parse("data/tourism.jsonld", format="json-ld")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/sparql", methods=["POST"])
def sparql_query():
    query = request.json.get("query")
    results = g.query(query)
    output = []
    for row in results:
        output.append([str(cell) for cell in row])
    return jsonify(output)

if __name__ == "__main__":
    app.run(debug=True)
