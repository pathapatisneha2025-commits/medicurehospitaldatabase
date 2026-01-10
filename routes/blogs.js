const express = require("express");
const pool = require("../db");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");
const cloudinary = require("../cloudinary");

const router = express.Router();

// -----------------------
// Multer & Cloudinary setup
// -----------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mblogs", // optional: separate folder
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => {
      const nameWithoutExt = path.parse(file.originalname).name;
      return Date.now() + "-" + nameWithoutExt;
    },
  },
});

const upload = multer({ storage });

// -----------------------
// MBLOG ROUTES
// -----------------------

// GET all mblogs
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM mblogs ORDER BY date DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// GET single mblog
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM mblogs WHERE id=$1",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).send("Blog not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// CREATE a new mblog
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, readTime, author, date } = req.body;

    const imageUrl = req.file ? req.file.path : "";
    const blogDate = date || new Date().toISOString().split("T")[0];

    const dbResult = await pool.query(
      `INSERT INTO mblogs
       (title, description, category, image, read_time, author, date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [title, description, category, imageUrl, readTime, author, blogDate]
    );

    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// UPDATE a mblog
router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, readTime, author, date } = req.body;

    const oldBlog = await pool.query(
      "SELECT * FROM mblogs WHERE id=$1",
      [id]
    );

    if (oldBlog.rows.length === 0) {
      return res.status(404).send("Blog not found");
    }

    const imageUrl = req.file
      ? req.file.path
      : oldBlog.rows[0].image;

    const blogDate = date || oldBlog.rows[0].date;

    const dbResult = await pool.query(
      `UPDATE mblogs
       SET title=$1,
           description=$2,
           category=$3,
           image=$4,
           read_time=$5,
           author=$6,
           date=$7
       WHERE id=$8
       RETURNING *`,
      [
        title,
        description,
        category,
        imageUrl,
        readTime,
        author,
        blogDate,
        id,
      ]
    );

    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// DELETE a mblog
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM mblogs WHERE id=$1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).send("Blog not found");
    res.json({ message: "Blog deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
