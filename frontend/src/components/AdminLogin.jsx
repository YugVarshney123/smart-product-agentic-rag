import { useState } from "react";
import { loginAdmin } from "../services/api.js";

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError("");
      const data = await loginAdmin(username, password);
      localStorage.setItem("adminToken", data.access_token);
      onLogin();
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <section className="admin-login-card">
      <h2>🔐 Admin Login</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="error-text">{error}</p>}

      <button onClick={handleLogin}>Login</button>
    </section>
  );
}

export default AdminLogin;