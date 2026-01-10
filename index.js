const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const blogRoutes = require("./routes/blogs"); // import routes

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/blogs", blogRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
