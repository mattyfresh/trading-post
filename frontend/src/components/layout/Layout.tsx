import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  Search,
  Message,
  Folder,
  User,
  Logout,
  Menu,
  X,
} from "pixelarticons/react";
import { useState } from "react";

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b-4 border-ink sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 border-2 border-ink shadow-pixel-sm flex items-center justify-center">
                <span className="font-display text-white text-xs">T</span>
              </div>
              <span className="font-display text-xs sm:text-sm text-ink tracking-wide">
                Trading Post
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/search"
                className="flex items-center space-x-1 font-bold uppercase tracking-wide text-xs text-ink hover:text-primary-600 transition-colors"
              >
                <Search className="w-5 h-5" />
                <span>Search cards or sellers</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1 font-bold uppercase tracking-wide text-xs text-ink hover:text-primary-600 transition-colors"
                  >
                    <Folder className="w-5 h-5" />
                    <span>My binders</span>
                  </Link>
                  <Link
                    to="/messages"
                    className="flex items-center space-x-1 font-bold uppercase tracking-wide text-xs text-ink hover:text-primary-600 transition-colors"
                  >
                    <Message className="w-5 h-5" />
                    <span>Messages</span>
                  </Link>
                  <div className="flex items-center space-x-4">
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 text-ink hover:text-primary-600 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-ink flex items-center justify-center overflow-hidden">
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <span className="font-medium">{user?.displayName}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-ink hover:text-danger transition-colors"
                      title="Logout"
                    >
                      <Logout className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="font-bold uppercase tracking-wide text-xs text-ink hover:text-primary-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="font-display text-[10px] tracking-wide bg-primary-600 text-white px-4 py-2 border-2 border-ink shadow-pixel-sm hover:bg-primary-700 active:shadow-none active:translate-x-1 active:translate-y-1 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-4 border-ink bg-white">
            <div className="px-4 py-4 space-y-4">
              <Link
                to="/search"
                className="flex items-center space-x-2 font-bold uppercase tracking-wide text-xs text-ink"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="w-5 h-5" />
                <span>Search cards or sellers</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 font-bold uppercase tracking-wide text-xs text-ink"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Folder className="w-5 h-5" />
                    <span>My binders</span>
                  </Link>
                  <Link
                    to="/messages"
                    className="flex items-center space-x-2 font-bold uppercase tracking-wide text-xs text-ink"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Message className="w-5 h-5" />
                    <span>Messages</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 font-bold uppercase tracking-wide text-xs text-danger"
                  >
                    <Logout className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block font-bold uppercase tracking-wide text-xs text-ink"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block font-display text-[10px] tracking-wide bg-primary-600 text-white px-4 py-2 border-2 border-ink shadow-pixel-sm text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-ink mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Trading Post - MTG Card Marketplace for Stockholm</p>
            <p className="mt-1">
              Card data provided by{" "}
              <a
                href="https://scryfall.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Scryfall
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
