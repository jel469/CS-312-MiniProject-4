// Express, PostgreSQL, and a React frontend for the main app
// handles user authentication and blog operations w/o server-side EJS templates
const express = require("express");
const path = require("path");
const session = require("express-session");
const methodOverride = require("method-override");
const { Pool } = require("pg");

// Create the Express app
const app = express();
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/BlogDB";

// PostgreSQL connection setup, able to fall back to local
const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Fallback in-memory storage creation
const fallbackUsers = [];
const fallbackPosts = [];
let nextPostId = 1;
let dbReady = false;

app.use(express.json()); // parses incoming JSON used by fetch/Axios requests
app.use(express.urlencoded({ extended: true })); // keeps form submissions working if needed
app.use(methodOverride("_method")); 
app.use(express.static(path.join(__dirname, "public"))); //  serves frontend files from the public folder
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mini-project-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  })
);

// trim whitespace so user input is consistent
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// setup the database tables and seed starter data
// make sure it keeps the backend compatible with React.
async function setUpTables() {
  try {
    await pool.query("SELECT 1");
    dbReady = true;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        blog_id SERIAL PRIMARY KEY,
        creator_name VARCHAR(255) NOT NULL,
        creator_user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        date_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_user_id) REFERENCES users(user_id)
      );
    `);

    const userCheck = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    if (userCheck.rows[0].count === 0) {
      await pool.query(`
        INSERT INTO users (user_id, password, name) VALUES
          ('alice', 'pass123', 'Alice Johnson'),
          ('bob', 'pass123', 'Bob Smith'),
          ('charlie', 'pass123', 'Charlie Brown');
      `);
    }

    const postCheck = await pool.query("SELECT COUNT(*)::int AS count FROM blogs");
    if (postCheck.rows[0].count === 0) {
      const stuff = [
        ["alice", "Alice Johnson", "Starting a New Chapter", "This is my first blog post. I am excited to begin this journaling journey and document my ideas, learning, and growth."],
        ["bob", "Bob Smith", "A Morning Walk and Fresh Ideas", "A simple walk in the morning can clear the mind and spark new ideas. The world feels calmer when you make space to think."],
        ["charlie", "Charlie Brown", "Why Small Habits Matter", "Consistency matters more than intensity. Small habits build momentum and create lasting change over time."],
        ["alice", "Alice Johnson", "Learning Through Practice", "Understanding a topic deeply takes repetition and curiosity. Rehearsing the fundamentals makes the bigger ideas easier to appreciate."],
        ["bob", "Bob Smith", "What I Want to Build Next", "The next project I want to build is one that is practical, useful, and meaningful for others. Good ideas become great when they solve real problems."],
      ];

      for (const [userId, name, title, body] of stuff) {
        await pool.query(
          `INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created)
           VALUES ($1, $2, $3, $4, NOW())`,
          [name, userId, title, body]
        );
      }
    }

    console.log("DB working");
  } catch (err) {
    dbReady = false;
    console.log("DB not working, using local data instead");
  }
}

// User account creation, login crediential checks
async function createUser(userId, password, name) {
  const cleanUserId = cleanText(userId);
  const cleanPassword = cleanText(password);
  const cleanName = cleanText(name);

  if (!cleanUserId || !cleanPassword || !cleanName) {
    return null;
  }

  if (dbReady) {
    const result = await pool.query(
      `INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3) RETURNING *`,
      [cleanUserId, cleanPassword, cleanName]
    );
    return result.rows[0];
  }

  const alreadyThere = fallbackUsers.find((user) => user.user_id === cleanUserId);
  if (alreadyThere) {
    return null;
  }

  const newUser = {
    user_id: cleanUserId,
    password: cleanPassword,
    name: cleanName,
  };

  fallbackUsers.push(newUser);
  return newUser;
}

// Look up functionality by their unique ID for login or signup checks.
async function findUser(userId) {
  const cleanUserId = cleanText(userId);

  if (dbReady) {
    const result = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [cleanUserId]);
    return result.rows[0] || null;
  }
  return fallbackUsers.find((user) => user.user_id === cleanUserId) || null;
}

// Retrieve all blog posts to display them in the homepage feed.
async function getPosts() {
  if (dbReady) {
    const result = await pool.query(`
      SELECT blog_id AS id, creator_name AS author, creator_user_id, title, body AS content, date_created AS createdAt
      FROM blogs
      ORDER BY date_created DESC
    `);
    return result.rows;
  }

  return [...fallbackPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Fetch one specific post by its ID
async function getPostById(postId) {
  const id = Number(postId);

  if (dbReady) {
    const result = await pool.query(
      `SELECT blog_id AS id, creator_name AS author, creator_user_id, title, body AS content, date_created AS createdAt
       FROM blogs WHERE blog_id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  return fallbackPosts.find((post) => post.id === id) || null;
}

// blog post creation, update, and deletion functions
async function addPost(postInfo) {
  const title = cleanText(postInfo.title);
  const body = cleanText(postInfo.body);

  if (!title || !body) {
    return null;
  }

  if (dbReady) {
    const result = await pool.query(
      `INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING blog_id AS id, creator_name AS author, creator_user_id, title, body AS content, date_created AS createdAt`,
      [postInfo.creatorName, postInfo.creatorUserId, title, body]
    );
    return result.rows[0];
  }

  const post = {
    id: nextPostId++,
    author: postInfo.creatorName,
    creator_user_id: postInfo.creatorUserId,
    title,
    content: body,
    createdAt: new Date().toISOString(),
  };

  fallbackPosts.unshift(post);
  return post;
}

// Update an existing post only, confirms users owns it
async function updatePost(postId, title, body) {
  const id = Number(postId);
  const cleanTitle = cleanText(title);
  const cleanBody = cleanText(body);

  if (dbReady) {
    const result = await pool.query(
      `UPDATE blogs
       SET title = $1, body = $2
       WHERE blog_id = $3
       RETURNING blog_id AS id, creator_name AS author, creator_user_id, title, body AS content, date_created AS createdAt`,
      [cleanTitle, cleanBody, id]
    );
    return result.rows[0] || null;
  }

  const index = fallbackPosts.findIndex((post) => post.id === id);
  if (index === -1) {
    return null;
  }

  fallbackPosts[index] = {
    ...fallbackPosts[index],
    title: cleanTitle,
    content: cleanBody,
  };

  return fallbackPosts[index];
}

// blog post deletion functionality, confirms user owns it
async function deletePost(postId) {
  const id = Number(postId);

  if (dbReady) {
    const result = await pool.query(`DELETE FROM blogs WHERE blog_id = $1 RETURNING blog_id AS id`, [id]);
    return result.rowCount > 0;
  }

  const oldLength = fallbackPosts.length;
  const filtered = fallbackPosts.filter((post) => post.id !== id);
  fallbackPosts.length = 0;
  fallbackPosts.push(...filtered);
  return filtered.length !== oldLength;
}

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", dbReady, user: req.session.user || null });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

// sign up functionality creation
// does checks then duplicates user IDs before creating a new user
app.post("/api/auth/signup", async (req, res) => {
  const { user_id, password, name } = req.body || {};
  const cleanUserId = cleanText(user_id);
  const cleanPassword = cleanText(password);
  const cleanName = cleanText(name);

  if (!cleanUserId || !cleanPassword || !cleanName) {
    return res.status(400).json({ success: false, message: "Please complete all signup fields." });
  }

  const existing = await findUser(cleanUserId);
  if (existing) {
    return res.status(409).json({ success: false, message: "That user ID is already taken." });
  }

  const user = await createUser(cleanUserId, cleanPassword, cleanName);
  if (!user) {
    return res.status(400).json({ success: false, message: "Unable to create the user account." });
  }

  return res.status(201).json({ success: true, user: { user_id: user.user_id, name: user.name } });
});

// Signin route for the React frontend
app.post("/api/auth/signin", async (req, res) => {
  const { user_id, password } = req.body || {};
  const cleanUserId = cleanText(user_id);
  const cleanPassword = cleanText(password);

  const user = await findUser(cleanUserId);
  if (!user || user.password !== cleanPassword) {
    return res.status(401).json({ success: false, message: "Invalid user ID or password." });
  }

  req.session.user = { user_id: user.user_id, name: user.name };
  return res.json({ success: true, user: req.session.user });
});

// Log out user of session
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "You have been logged out." });
  });
});


// fetching all posts for the homepage
app.get("/api/posts", async (req, res) => {
  const posts = await getPosts();
  res.json({ success: true, posts, user: req.session.user || null });
});

// return a single post by ID
app.get("/api/posts/:id", async (req, res) => {
  const post = await getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  res.json({ success: true, post });
});

// new blog post creation from the React form.
app.post("/api/posts", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Please sign in before creating a post." });
  }

  const { title, body } = req.body || {};
  const cleanTitle = cleanText(title);
  const cleanBody = cleanText(body);

  if (!cleanTitle || !cleanBody) {
    return res.status(400).json({ success: false, message: "Title and content are both required." });
  }

  const post = await addPost({
    title: cleanTitle,
    body: cleanBody,
    creatorName: req.session.user.name,
    creatorUserId: req.session.user.user_id,
  });

  return res.status(201).json({ success: true, post });
});

// Update a post after confirming it belongs to the current user
app.put("/api/posts/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Please sign in to update a post." });
  }

  const post = await getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  if (post.creator_user_id !== req.session.user.user_id) {
    return res.status(403).json({ success: false, message: "You can only edit your own posts." });
  }

  const { title, body } = req.body || {};
  const cleanTitle = cleanText(title);
  const cleanBody = cleanText(body);

  if (!cleanTitle || !cleanBody) {
    return res.status(400).json({ success: false, message: "Title and content are both required." });
  }

  const updatedPost = await updatePost(req.params.id, cleanTitle, cleanBody);
  return res.json({ success: true, post: updatedPost });
});


// delete a post only if the current user created it
app.delete("/api/posts/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Please sign in to delete a post." });
  }

  const post = await getPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found." });
  }

  if (post.creator_user_id !== req.session.user.user_id) {
    return res.status(403).json({ success: false, message: "You can only delete your own posts." });
  }

  await deletePost(req.params.id);
  return res.json({ success: true, message: "Post deleted successfully." });
});

app.get(["/", "/signin", "/signup"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function startServer() {
  await setUpTables();
  app.listen(port, () => {
    console.log(`Blog app running at http://localhost:${port}`);
  });
}
startServer();
