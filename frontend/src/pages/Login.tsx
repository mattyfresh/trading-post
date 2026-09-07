import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-xl sm:text-2xl text-ink">
            Welcome Back
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to your Trading Post account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 border-4 border-ink shadow-pixel"
        >
          {error && (
            <div className="mb-4 p-3 bg-danger-100 border-2 border-danger text-danger-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-ink focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-ink focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full border-2 border-ink shadow-pixel-sm bg-primary-600 text-white py-2 px-4 font-display text-[10px] tracking-wide hover:bg-primary-700 active:shadow-none active:translate-x-1 active:translate-y-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:active:shadow-pixel-sm disabled:active:translate-x-0 disabled:active:translate-y-0"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-gray-600 mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
