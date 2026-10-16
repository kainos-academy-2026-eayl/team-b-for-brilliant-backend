import express, { Request, Response } from "express";

interface User {
  email: string;
  password: string;
}

interface LoginRequest {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const users: User[] = [
  { email: "alice@example.com", password: "password123" },
  { email: "bob@example.com", password: "letmein" },
];

const app = express();
app.use(express.json());

app.post("/login", (req: Request<object, object, LoginRequest>, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Email address is not valid" });
  }

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.json({ message: "Login successful" });
});

if (require.main === module) {
  app.listen(3000, () => console.log("Listening on http://localhost:3000"));
}

export default app;
