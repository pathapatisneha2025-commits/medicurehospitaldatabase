const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const blogRoutes = require("./routes/blogs"); // import routes
const adminRoutes = require("./routes/admin"); // import routes

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/blogs", blogRoutes);
app.use("/admin", adminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
