import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://pulp-portal-backend-production.up.railway.app";

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getCurrentUser()?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { token } = await refreshToken();

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/register", {
      username,
      email,
      password,
    });

    if (response.data.token) {
      setAuthData(response.data);
    }
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Registration failed. Please try again."
    );
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/login", {
      email,
      password,
    });

    if (response.data.token) {
      setAuthData(response.data);
    }
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Login failed. Please try again."
    );
  }
};

export const logout = (): void => {
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};

export const getCurrentUser = (): AuthResponse | null => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      localStorage.removeItem("user");
      return null;
    }
  }
  return null;
};

export const getAuthHeader = (): { Authorization: string } => {
  const user = getCurrentUser();
  if (user?.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return { Authorization: "" };
};

const refreshToken = async (): Promise<AuthResponse> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await api.post("/refresh-token", { refreshToken });
    setAuthData(response.data);
    return response.data;
  } catch (error) {
    throw new Error("Failed to refresh token");
  }
};

const setAuthData = (data: AuthResponse): void => {
  localStorage.setItem("user", JSON.stringify(data));
  // Dispatch custom event for auth state change
  window.dispatchEvent(new Event("authStateChange"));
};
