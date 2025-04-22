import React, { useEffect, useState } from "react";
import { getDocuments, createDownloadLink } from "../services/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface Document {
  _id: string;
  tradeName: string;
  commodities: string;
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
      const result = await getDocuments();
      if (result.success) {
        setDocuments(result.data);
      } else {
        setError("Failed to load documents");
      }
    } catch (err) {
      setError("Error loading documents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      console.log("Downloading file:", fileId, fileName);
      await createDownloadLink(fileId, fileName);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file. Please try again.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

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
                    {doc.tradeName || "Untitled"}
                  </h2>
                  <p className="text-gray-600">
                    {doc.commodities || "No commodities specified"}
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
