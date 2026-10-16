import express, { Request, Response } from "express";

interface User {
  username: string;
  password: string;
}

interface LoginRequest {
  username?: string;
  password?: string;
}

const users: User[] = [
  { username: "alice", password: "password123" },
  { username: "bob", password: "letmein" },
];

const app = express();
app.use(express.json());

app.post("/login", (req: Request<object, object, LoginRequest>, res: Response) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  return res.json({ message: "Login successful" });
});

if (require.main === module) {
  app.listen(3000, () => console.log("Listening on http://localhost:3000"));
}

export default app;
