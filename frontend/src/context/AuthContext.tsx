import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../services/api";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "farmer" | "provider" | "admin";
  extraInfo: string;
  status: "active" | "suspended";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    extraInfo: string;
  }) => Promise<User>;
  logout: () => void;
  updateUserProfile: (data: { name: string; phone: string; extraInfo: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Initialize and load user profile if token is present
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await API.get("/auth/profile");
          setUser(res.data.user);
        } catch (err) {
          console.error("Failed to load user profile", err);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string, role: string): Promise<User> => {
    try {
      const res = await API.post("/auth/login", { email, password, role });
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem("token", receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Login failed. Please check credentials.";
      throw new Error(errorMsg);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    extraInfo: string;
  }): Promise<User> => {
    try {
      const res = await API.post("/auth/register", data);
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem("token", receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Registration failed. Please check parameters.";
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = async (data: {
    name: string;
    phone: string;
    extraInfo: string;
  }): Promise<User> => {
    try {
      const res = await API.put("/auth/profile", data);
      const { user: updatedUser } = res.data;
      setUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to update profile.";
      throw new Error(errorMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
