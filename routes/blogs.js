const express = require("express");
const pool = require("../db"); // PostgreSQL connection
const cloudinary = require("../cloudinary"); // Cloudinary client
const multer = require("multer");

const router = express.Router();

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -----------------------
// BLOG ROUTES
// -----------------------

// GET all blogs
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM blogs ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// GET single blog
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM blogs WHERE id=$1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Blog not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// CREATE a new blog with image
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, readTime, author, date } = req.body;
    let imageUrl = "";

    if (req.file) {
      // Upload file from path to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "blogs",
      });
      imageUrl = result.secure_url;

      // Delete the local file after upload
      fs.unlinkSync(req.file.path);
    }

    const dbResult = await pool.query(
      `INSERT INTO blogs (title, description, category, image, read_time, author, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, category, imageUrl, readTime, author, date || new Date()]
    );

    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// UPDATE a blog with optional image
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  try {
    const { title, description, category, readTime, author, date } = req.body;
    let imageUrl;

    const oldBlog = await pool.query("SELECT * FROM blogs WHERE id=$1", [id]);
    if (oldBlog.rows.length === 0) return res.status(404).send("Blog not found");

    if (req.file) {
      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload_stream(
        { folder: "blogs" },
        async (error, result) => {
          if (error) return res.status(500).send("Image upload failed");
          imageUrl = result.secure_url;

          const dbResult = await pool.query(
            `UPDATE blogs
             SET title=$1, description=$2, category=$3, image=$4, read_time=$5, author=$6, date=$7
             WHERE id=$8 RETURNING *`,
            [
              title,
              description,
              category,
              imageUrl || oldBlog.rows[0].image,
              readTime,
              author,
              date || oldBlog.rows[0].date,
              id,
            ]
          );

          res.json(dbResult.rows[0]);
        }
      );

      require("streamifier").createReadStream(req.file.buffer).pipe(result);
    } else {
      const dbResult = await pool.query(
        `UPDATE blogs
         SET title=$1, description=$2, category=$3, image=$4, read_time=$5, author=$6, date=$7
         WHERE id=$8 RETURNING *`,
        [
          title,
          description,
          category,
          oldBlog.rows[0].image,
          readTime,
          author,
          date || oldBlog.rows[0].date,
          id,
        ]
      );

      res.json(dbResult.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE a blog
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM blogs WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).send("Blog not found");
    res.json({ message: "Blog deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
