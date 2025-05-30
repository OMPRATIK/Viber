import { useState } from "react";
import { authClient } from "./lib/auth-client";

function App() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { data, error } = await authClient.signUp.email({
      email: formData.email,
      password: formData.password,
      name: formData.username,
      image: "https://example.com/image.png",
    });

    if (error) {
      console.error("Error signing up:", error);
      return;
    }
    console.log(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="username"
          value={formData.username}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, username: e.target.value }))
          }
        />
        <input
          type="email"
          placeholder="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
        />
        <input
          type="password"
          placeholder="password"
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;
