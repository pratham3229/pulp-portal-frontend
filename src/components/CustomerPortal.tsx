import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "../utils";

interface FormData {
  woodOrigins: {
    country: string;
    harvestDate: string;
    description: string;
    area: number;
  }[];
}

// Load saved form data from localStorage
const loadSavedFormData = (): FormData => {
  const saved = localStorage.getItem("woodOriginFormData");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        woodOrigins: parsed.woodOrigins.map((origin: any) => ({
          country: origin.country || "",
          harvestDate: origin.harvestDate || "",
          description: origin.description || "",
          area: origin.area || 0,
        })),
      };
    } catch (e) {
      console.error("Error loading saved form data:", e);
    }
  }
  return {
    woodOrigins: [
      {
        country: "",
        harvestDate: "",
        description: "",
        area: 0,
      },
    ],
  };
};

export function CustomerPortal() {
  const [activeTab, setActiveTab] = useState("upload");
  const [formData, setFormData] = useState<FormData>(loadSavedFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("woodOriginFormData", JSON.stringify(formData));
  }, [formData]);

  const handleWoodOriginChange = useCallback(
    (index: number, field: keyof FormData["woodOrigins"][0], value: any) => {
      setFormData((prevData) => {
        const newWoodOrigins = [...prevData.woodOrigins];
        newWoodOrigins[index] = {
          ...newWoodOrigins[index],
          [field]: value,
        };
        return { ...prevData, woodOrigins: newWoodOrigins };
      });
    },
    []
  );

  const addWoodOrigin = useCallback(() => {
    setFormData((prevData) => ({
      ...prevData,
      woodOrigins: [
        ...prevData.woodOrigins,
        {
          country: "",
          harvestDate: "",
          description: "",
          area: 0,
        },
      ],
    }));
  }, []);

  const removeWoodOrigin = useCallback((index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      woodOrigins: prevData.woodOrigins.filter((_, i) => i !== index),
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    for (const origin of formData.woodOrigins) {
      if (!origin.country) {
        setError("Please select a country for all wood origins");
        return false;
      }
      if (!origin.harvestDate) {
        setError("Please select a harvest date for all wood origins");
        return false;
      }
      if (origin.area <= 0) {
        setError("Please enter a valid area for all wood origins");
        return false;
      }
    }
    setError(null);
    return true;
  }, [formData.woodOrigins]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Clear saved form data after successful submission
      localStorage.removeItem("woodOriginFormData");

      // Switch to review tab after successful submission
      setActiveTab("review");
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex space-x-4 mb-6">
        <Button
          variant={activeTab === "upload" ? "default" : "outline"}
          onClick={() => handleTabChange("upload")}
        >
          Upload
        </Button>
        <Button
          variant={activeTab === "review" ? "default" : "outline"}
          onClick={() => handleTabChange("review")}
        >
          Review
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {activeTab === "upload" ? (
        <div className="space-y-6">
          {formData.woodOrigins.map((origin, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Wood Origin {index + 1}</h3>
                {index > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeWoodOrigin(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`country-${index}`}>Country</Label>
                  <Input
                    id={`country-${index}`}
                    value={origin.country}
                    onChange={(e) =>
                      handleWoodOriginChange(index, "country", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`harvestDate-${index}`}>Harvest Date</Label>
                  <Input
                    id={`harvestDate-${index}`}
                    type="datetime-local"
                    value={origin.harvestDate}
                    onChange={(e) =>
                      handleWoodOriginChange(
                        index,
                        "harvestDate",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`area-${index}`}>Area (hectares)</Label>
                  <Input
                    id={`area-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={origin.area}
                    onChange={(e) =>
                      handleWoodOriginChange(
                        index,
                        "area",
                        parseFloat(e.target.value)
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    value={origin.description}
                    onChange={(e) =>
                      handleWoodOriginChange(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex space-x-4">
            <Button onClick={addWoodOrigin}>Add Wood Origin</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {formData.woodOrigins.map((origin, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-4 bg-white shadow-sm"
            >
              <h3 className="text-lg font-medium">Wood Origin {index + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Country:</span>{" "}
                    {origin.country}
                  </p>
                  <p>
                    <span className="font-medium">Harvest Date:</span>{" "}
                    {origin.harvestDate}
                  </p>
                </div>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Area:</span> {origin.area}{" "}
                    hectares
                  </p>
                  {origin.description && (
                    <p>
                      <span className="font-medium">Description:</span>{" "}
                      {origin.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerPortal;
