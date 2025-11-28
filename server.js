const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 5000;

// File paths
const usersDataPath = path.join(__dirname, "data", "users.json");
const postsDataPath = path.join(__dirname, "data", "posts.json");

// Helper - Read JSON file
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (err) {
    return {};
  }
}

// Helper - Write JSON file
function writeJSON(file, data) {
  if (data.users) {
    data.users = data.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      age: u.age,
      role: u.role
    }));
  }

  if (data.posts) {
    data.posts = data.posts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      date: p.date
    }));
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Helper - Parse body
function getBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const parsedUrl = url.parse(req.url, true);
  const route = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  const query = parsedUrl.query;

  // ========================================================
  // USERS CRUD
  // ========================================================

  // GET USERS
  if (route === "users" && req.method === "GET") {
    const data = readJSON(usersDataPath) || { users: [] };

    if (query.id) {
      const user = data.users.find((u) => u.id == query.id);
      return res.end(
        user ? JSON.stringify(user) : JSON.stringify({ error: "User not found" })
      );
    }

    return res.end(JSON.stringify(data));
  }

  // CREATE USER
if (route === "users" && req.method === "POST") {
  const data = readJSON(usersDataPath) || { users: [] };
  const body = await getBody(req);

  // Auto-increment ID
  let newId = 1;

  if (data.users.length > 0) {
    const lastUser = data.users[data.users.length - 1];
    newId = lastUser.id + 1;
  }

  body.id = newId;

  data.users.push(body);

  writeJSON(usersDataPath, data);
  res.statusCode = 201;

  return res.end(JSON.stringify({ message: "User created", user: body }));
}

  // UPDATE USER
  if (route === "users" && req.method === "PUT") {
    const data = readJSON(usersDataPath);
    const body = await getBody(req);

    const index = data.users.findIndex((u) => u.id == query.id);
    if (index === -1) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "User not found" }));
    }

    data.users[index] = { ...data.users[index], ...body };
    writeJSON(usersDataPath, data);

    return res.end(JSON.stringify({ message: "User updated", user: data.users[index] }));
  }

  // DELETE USER
  if (route === "users" && req.method === "DELETE") {
    const data = readJSON(usersDataPath);
    const newUsers = data.users.filter((u) => u.id != query.id);

    if (newUsers.length === data.users.length) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "User not found" }));
    }

    writeJSON(usersDataPath, { users: newUsers });
    return res.end(JSON.stringify({ message: "User deleted" }));
  }

  // ========================================================
  // POSTS CRUD
  // ========================================================

  // GET POSTS
  if (route === "posts" && req.method === "GET") {
    const data = readJSON(postsDataPath) || { posts: [] };

    if (query.id) {
      const post = data.posts.find((p) => p.id == query.id);
      return res.end(
        post ? JSON.stringify(post) : JSON.stringify({ error: "Post not found" })
      );
    }

    return res.end(JSON.stringify(data));
  }

  // CREATE POST
  if (route === "posts" && req.method === "POST") {
  const data = readJSON(postsDataPath) || { posts: [] };
  const body = await getBody(req);

  // Generate serial ID
  const newId = data.posts.length > 0 
    ? data.posts[data.posts.length - 1].id + 1 
    : 1;

  body.id = newId;
  body.date = new Date().toISOString().slice(0, 10); // auto date

  data.posts.push(body);
  writeJSON(postsDataPath, data);

  res.statusCode = 201;
  return res.end(JSON.stringify({ message: "Post created", post: body }));
}


  // UPDATE POST
  if (route === "posts" && req.method === "PUT") {
    const data = readJSON(postsDataPath);
    const body = await getBody(req);

    const index = data.posts.findIndex((p) => p.id == query.id);

    if (index === -1) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Post not found" }));
    }

    data.posts[index] = { ...data.posts[index], ...body };
    writeJSON(postsDataPath, data);

    return res.end(JSON.stringify({ message: "Post updated", post: data.posts[index] }));
  }

  // DELETE POST
  if (route === "posts" && req.method === "DELETE") {
    const data = readJSON(postsDataPath);

    const filtered = data.posts.filter((p) => p.id != query.id);

    if (filtered.length === data.posts.length) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Post not found" }));
    }

    writeJSON(postsDataPath, { posts: filtered });

    return res.end(JSON.stringify({ message: "Post deleted" }));
  }

  // DEFAULT – ROUTE LIST
  res.end(
    JSON.stringify({
      message: "Available Routes",
      users: {
        GET: "/users or /users?id=",
        POST: "/users",
        PUT: "/users?id=",
        DELETE: "/users?id=",
      },
      posts: {
        GET: "/posts or /posts?id=",
        POST: "/posts",
        PUT: "/posts?id=",
        DELETE: "/posts?id=",
      },
    })
  );
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
