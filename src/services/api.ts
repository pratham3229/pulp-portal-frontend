import axios from "axios";
import { getAuthHeader } from "./authService";

const API_URL = process.env.REACT_APP_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth header to all requests
api.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

interface FileUploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
}

export const submitDocument = async (formData: any, fileData: any) => {
  try {
    // First, upload all files
    const fileUploads = await Promise.all(
      Object.entries(fileData)
        .filter(([_, file]) => file !== null)
        .map(async ([key, file]) => {
          const uploadResult = await uploadFile(file as File);
          return [key, uploadResult.fileId];
        })
    );

    // Create files object with uploaded file IDs
    const files = Object.fromEntries(fileUploads);

    // Submit the form data with file references
    const response = await api.post("/submit", {
      ...formData,
      files,
    });

    return response.data;
  } catch (error) {
    console.error("Error submitting document:", error);
    throw error;
  }
};

export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  try {
    console.log("Starting file upload:", file.name);
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const getDocuments = async () => {
  try {
    const response = await api.get("/documents");
    return response.data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};

export const getDocument = async (id: string) => {
  try {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};

export const downloadFile = async (fileId: string): Promise<Blob> => {
  try {
    console.log("Starting file download:", fileId);
    const response = await api.get(`/download/${fileId}`, {
      responseType: "blob",
    });
    console.log("Download successful");
    return response.data;
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

// Helper function to create a download link
export const createDownloadLink = async (
  fileId: string,
  fileName: string
): Promise<void> => {
  try {
    const blob = await downloadFile(fileId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error creating download link:", error);
    throw error;
  }
};
