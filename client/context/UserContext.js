"use client";
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const response = await fetch("http://localhost:4000/api/me", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.authenticated) {
        setUser(data.user);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("http://localhost:4000/logout", {
        method: "GET",
        credentials: "include",
      });
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  const value = {
    user,
    authenticated,
    loading,
    setUser,
    setAuthenticated,
    fetchUser,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
