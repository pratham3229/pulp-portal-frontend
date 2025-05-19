import React, { useEffect, useState } from "react";
import { getDocuments, createDownloadLink } from "../services/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface Document {
  _id: string;
  pulpType: string;
  commodities: string;
  commonName: string;
  scientificName: string;
  files: Record<string, string>;
  createdAt: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getDocuments();
      if (result.success) {
        setDocuments(result.data);
      } else {
        setError(result.error || "Failed to load documents");
      }
    } catch (err: any) {
      console.error("Error loading documents:", err);
      setError(
        err.response?.data?.error || err.message || "Error loading documents"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      setError("");
      console.log("Downloading file:", fileId, fileName);
      await createDownloadLink(fileId, fileName);
    } catch (err: any) {
      console.error("Error downloading file:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to download file. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">
              Error Loading Documents
            </h3>
            <p className="text-red-600 mt-1">{error}</p>
            <Button onClick={loadDocuments} variant="outline" className="mt-3">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Documents Found
          </h2>
          <p className="text-gray-600">
            You haven't submitted any documents yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Submitted Documents</h1>
      <div className="grid gap-6">
        {documents.map((doc) => (
          <Card key={doc._id} className="shadow-md">
            <CardContent className="p-6">
              <div className="grid gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {doc.pulpType || "Untitled"}
                  </h2>
                  <p className="text-gray-600">
                    {doc.commodities || "No commodities specified"}
                  </p>
                  <p className="text-gray-600">
                    Common Name: {doc.commonName || "Not specified"}
                  </p>
                  <p className="text-gray-600">
                    Scientific Name: {doc.scientificName || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted on: {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Uploaded Files:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(doc.files || {}).map(([key, fileId]) =>
                      fileId ? (
                        <div
                          key={key}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm truncate">{key}</span>
                          <Button
                            onClick={() =>
                              handleDownload(fileId, `${key}_${doc._id}`)
                            }
                            className="ml-2"
                            size="sm"
                          >
                            Download
                          </Button>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
