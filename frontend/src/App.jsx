import { useState } from "react";
import Home from "./pages/Home.jsx";
import AdminPreview from "./components/AdminPreview.jsx";
import RoleSelection from "./components/RoleSelection.jsx";
import "./index.css";

function App() {
  const [role, setRole] = useState("");

  if (!role) {
    return (
      <RoleSelection
        onCustomer={() => setRole("customer")}
        onAdmin={() => setRole("admin")}
      />
    );
  }

  if (role === "customer") {
    return (
      <>
        <button className="back-role-btn" onClick={() => setRole("")}>
          ⬅ Change Role
        </button>
        <Home hideAdmin />
      </>
    );
  }

  if (role === "admin") {
    return (
      <>
        <button className="back-role-btn" onClick={() => setRole("")}>
          ⬅ Change Role
        </button>
        <main className="main-container">
          <AdminPreview />
        </main>
      </>
    );
  }
}

export default App;