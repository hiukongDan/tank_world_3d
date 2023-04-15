const express = require("express");
const path = require("path");

const app = express();

const port = 3000;

app.on("/", (req, res) => {
    app.redirect("index.html");
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/three", express.static(path.join(__dirname, "node_modules/three")));

app.listen(port, "0.0.0.0", () => {
    console.log("server opened on port: " + port);
});