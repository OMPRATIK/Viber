import { useState } from "react";
import { authClient } from "./lib/authClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "./components/ui/label";
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
    <div className="h-screen flex items-center justify-center">
      <div>
        <form
          onSubmit={handleSubmit}
          className="w-[300px] shadow-sm rounded-md flex flex-col gap-3 p-5 bg-card border border-border"
        >
          <header className="mb-4">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details to get started
            </p>
          </header>

          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="username"
            value={formData.username}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, username: e.target.value }))
            }
          />
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
          />
          <Button type="submit">Submit</Button>
        </form>
      </div>
    </div>
  );
}

export default App;
