import React, { useState, ChangeEvent } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { submitDocument } from "../services/api";
import { GeoJSONPreview } from "../components/GeoJSONPreview";

interface FormData {
  // Basic Details
  pulpType: string | null;
  commodities: string | null;
  commonName: string | null;
  scientificName: string | null;
  quantity: string | null;

  // Supplier Details
  suppliers: Array<{
    name: string | null;
    email: string | null;
    country: string | null;
    region: string | null;
  }>;

  // Producer Details
  producers: Array<{
    name: string | null;
    email: string | null;
    country: string | null;
    region: string | null;
  }>;

  // Wood Origin Details
  woodOrigins: {
    country: string;
    harvestDate: string;
    description: string;
    area: number;
    geojsonFile: File | null;
    geojsonData: any | null;
  }[];

  // Geolocation Details
  geolocations: Array<{
    polygon: string | null;
    description: string | null;
  }>;
}

interface FileData {
  // Transaction Documents
  geoToProducerInvoice: File | null;
  woodTransportDocs: File | null;
  producerToSupplierInvoice: File | null;
  pulpTransportDocs: File | null;
  supplierToITCInvoice: File | null;
  shippingDocs: File | null;
  ddsSummary: File | null;

  // Legal Documents
  legalHarvestDocs: File | null;
  fscCertificates: File | null;
  fscCocCertificate: File | null;
  producerDeclaration: File | null;
  producerLicense: File | null;
  supplierLicense: File | null;

  // Compliance Documents
  ghgCertifications: File | null;
  safetyCertifications: File | null;
  humanRightsPolicies: File | null;
  employeeRecords: File | null;
}

const initialFormData: FormData = {
  pulpType: null,
  commodities: null,
  commonName: null,
  scientificName: null,
  quantity: null,
  suppliers: [
    {
      name: null,
      email: null,
      country: null,
      region: null,
    },
  ],
  producers: [
    {
      name: null,
      email: null,
      country: null,
      region: null,
    },
  ],
  woodOrigins: [
    {
      country: "",
      harvestDate: "",
      description: "",
      area: 0,
      geojsonFile: null,
      geojsonData: null,
    },
  ],
  geolocations: [
    {
      polygon: null,
      description: null,
    },
  ],
};

const initialFileData: FileData = {
  geoToProducerInvoice: null,
  woodTransportDocs: null,
  producerToSupplierInvoice: null,
  pulpTransportDocs: null,
  supplierToITCInvoice: null,
  shippingDocs: null,
  ddsSummary: null,
  legalHarvestDocs: null,
  fscCertificates: null,
  fscCocCertificate: null,
  producerDeclaration: null,
  producerLicense: null,
  supplierLicense: null,
  ghgCertifications: null,
  safetyCertifications: null,
  humanRightsPolicies: null,
  employeeRecords: null,
};

const sections = [
  "Basic Details",
  "Location Info",
  "Geolocation",
  "Transaction Documents",
  "Legal Documents",
  "Compliance",
  "Review",
];

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState(sections[0]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [fileData, setFileData] = useState<FileData>(initialFileData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<
    Array<{ formData: FormData; fileData: FileData }>
  >([]);
  const [showGeoJSONPreview, setShowGeoJSONPreview] = useState(false);
  const [currentGeoJSONIndex, setCurrentGeoJSONIndex] = useState<number | null>(
    null
  );

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Handle nested fields (suppliers, producers, woodOrigins, and geolocations)
    if (
      name.startsWith("suppliers.") ||
      name.startsWith("producers.") ||
      name.startsWith("woodOrigins.") ||
      name.startsWith("geolocations.")
    ) {
      const [parent, index, field] = name.split(".");
      setFormData((prev) => {
        const parentArray = [...(prev[parent as keyof FormData] as Array<any>)];
        parentArray[parseInt(index)] = {
          ...parentArray[parseInt(index)],
          [field]: value,
        };
        return {
          ...prev,
          [parent]: parentArray,
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFileData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      console.log("Starting form submission...");

      // Prepare form data by converting empty strings to null
      const preparedFormData = Object.entries(formData).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value === "" ? null : value,
        }),
        initialFormData
      );

      console.log("Prepared Form Data:", preparedFormData);
      console.log("File Data:", fileData);

      console.log("Submitting to backend...");
      // Submit to backend
      const result = await submitDocument(preparedFormData, fileData);
      console.log("Submission result:", result);

      if (result.success) {
        // Save submission locally
        setSubmissions((prev) => [
          ...prev,
          { formData: preparedFormData, fileData },
        ]);

        // Reset form
        setFormData(initialFormData);
        setFileData(initialFileData);
        setActiveTab(sections[0]);
        alert("Form submitted successfully!");
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(
        err.message ||
          "An error occurred while submitting the form. Please check the console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField = ({
    name,
    label,
  }: {
    name: keyof FileData;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-base font-medium">{label}</Label>
      <Input
        type="file"
        name={name}
        onChange={handleFileChange}
        className="cursor-pointer"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      {fileData[name] && (
        <p className="text-sm text-green-600">
          File selected: {fileData[name]?.name}
        </p>
      )}
    </div>
  );

  const addSupplier = () => {
    setFormData((prev) => ({
      ...prev,
      suppliers: [
        ...prev.suppliers,
        { name: null, email: null, country: null, region: null },
      ],
    }));
  };

  const addProducer = () => {
    setFormData((prev) => ({
      ...prev,
      producers: [
        ...prev.producers,
        { name: null, email: null, country: null, region: null },
      ],
    }));
  };

  const removeSupplier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((_, i) => i !== index),
    }));
  };

  const removeProducer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      producers: prev.producers.filter((_, i) => i !== index),
    }));
  };

  const handleWoodOriginChange = (
    index: number,
    field: keyof FormData["woodOrigins"][0],
    value: string | number
  ) => {
    setFormData((prev) => {
      const woodOrigins = [...prev.woodOrigins];
      woodOrigins[index] = {
        ...woodOrigins[index],
        [field]: value,
      };
      return {
        ...prev,
        woodOrigins,
      };
    });
  };

  const handleAddWoodOrigin = () => {
    setFormData((prev) => ({
      ...prev,
      woodOrigins: [
        ...prev.woodOrigins,
        {
          country: "",
          harvestDate: "",
          description: "",
          area: 0,
          geojsonFile: null,
          geojsonData: null,
        },
      ],
    }));
  };

  const formatDateForInput = (date: string): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  };

  const addGeolocation = () => {
    setFormData((prev) => ({
      ...prev,
      geolocations: [
        ...prev.geolocations,
        { polygon: null, description: null },
      ],
    }));
  };

  const removeGeolocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      geolocations: prev.geolocations.filter((_, i) => i !== index),
    }));
  };

  const handleGeoJsonUpload = async (index: number, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const geojsonData = JSON.parse(e.target?.result as string);

          // Validate GeoJSON structure
          if (!geojsonData.type || !geojsonData.features) {
            throw new Error("Invalid GeoJSON format");
          }

          // Show preview
          setCurrentGeoJSONIndex(index);
          setShowGeoJSONPreview(true);

          // Update form data with file and parsed GeoJSON
          setFormData((prev) => {
            const woodOrigins = [...prev.woodOrigins];
            woodOrigins[index] = {
              ...woodOrigins[index],
              geojsonFile: file,
              geojsonData: geojsonData,
            };
            return { ...prev, woodOrigins };
          });
        } catch (error) {
          console.error("Error parsing GeoJSON:", error);
          setError("Invalid GeoJSON file format");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setError("Error reading GeoJSON file");
    }
  };

  const handleGeoJSONValidate = (selectedPlots: any[]) => {
    if (currentGeoJSONIndex === null) return;

    setFormData((prev) => {
      const woodOrigins = [...prev.woodOrigins];
      woodOrigins[currentGeoJSONIndex] = {
        ...woodOrigins[currentGeoJSONIndex],
        geojsonData: {
          ...woodOrigins[currentGeoJSONIndex].geojsonData,
          features: selectedPlots,
        },
      };
      return { ...prev, woodOrigins };
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card className="shadow-xl rounded-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Pulp Documentation Form</h2>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <div className="border-b">
              <TabsList className="flex justify-between w-full">
                {sections.map((section) => (
                  <TabsTrigger
                    key={section}
                    value={section}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                  >
                    {section}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="mt-8">
              <TabsContent value="Basic Details" className="space-y-4">
                <div className="grid gap-6">
                  <div>
                    <Label className="text-base font-medium">Pulp Type</Label>
                    <Input
                      name="pulpType"
                      value={formData.pulpType || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Relevant Commodities Used
                    </Label>
                    <Input
                      name="commodities"
                      value={formData.commodities || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Common Name</Label>
                    <Input
                      name="commonName"
                      value={formData.commonName || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Scientific Name
                    </Label>
                    <Input
                      name="scientificName"
                      value={formData.scientificName || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Quantity (In MT)
                    </Label>
                    <Input
                      type="number"
                      name="quantity"
                      value={formData.quantity || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Location Info" className="space-y-4">
                <div className="grid gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Pulp Supplier Details
                      </h3>
                      <Button
                        onClick={addSupplier}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Supplier
                      </Button>
                    </div>
                    {formData.suppliers.map((supplier, index) => (
                      <div
                        key={index}
                        className="border p-4 rounded-lg space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Supplier {index + 1}</h4>
                          {index > 0 && (
                            <Button
                              onClick={() => removeSupplier(index)}
                              variant="destructive"
                              size="sm"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-4">
                          <div>
                            <Label className="text-base font-medium">
                              Supplier Name
                            </Label>
                            <Input
                              name={`suppliers.${index}.name`}
                              value={supplier.name || ""}
                              onChange={handleInputChange}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Supplier Email
                            </Label>
                            <Input
                              type="email"
                              name={`suppliers.${index}.email`}
                              value={supplier.email || ""}
                              onChange={handleInputChange}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Supplier Country
                            </Label>
                            <select
                              name={`suppliers.${index}.country`}
                              value={supplier.country || ""}
                              onChange={handleInputChange}
                              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                              <option value="">Select Country</option>
                              <option value="USA">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="Brazil">Brazil</option>
                              <option value="Sweden">Sweden</option>
                              <option value="Finland">Finland</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Supplier Region
                            </Label>
                            <Input
                              name={`suppliers.${index}.region`}
                              value={supplier.region || ""}
                              onChange={handleInputChange}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Pulp Producer Details
                      </h3>
                      <Button
                        onClick={addProducer}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Producer
                      </Button>
                    </div>
                    {formData.producers.map((producer, index) => (
                      <div
                        key={index}
                        className="border p-4 rounded-lg space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Producer {index + 1}</h4>
                          {index > 0 && (
                            <Button
                              onClick={() => removeProducer(index)}
                              variant="destructive"
                              size="sm"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-4">
                          <div>
                            <Label className="text-base font-medium">
                              Producer Name
                            </Label>
                            <Input
                              name={`producers.${index}.name`}
                              value={producer.name || ""}
                              onChange={handleInputChange}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Producer Email
                            </Label>
                            <Input
                              type="email"
                              name={`producers.${index}.email`}
                              value={producer.email || ""}
                              onChange={handleInputChange}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Producer Country
                            </Label>
                            <select
                              name={`producers.${index}.country`}
                              value={producer.country || ""}
                              onChange={handleInputChange}
                              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                              <option value="">Select Country</option>
                              <option value="USA">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="Brazil">Brazil</option>
                              <option value="Sweden">Sweden</option>
                              <option value="Finland">Finland</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Producer Region
                            </Label>
                            <Input
                              name={`producers.${index}.region`}
                              value={producer.region || ""}
                              onChange={handleInputChange}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Geolocation" className="space-y-4">
                <div className="grid gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Wood Origin Details
                      </h3>
                      <Button
                        onClick={handleAddWoodOrigin}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Add Wood Origin
                      </Button>
                    </div>
                    {formData.woodOrigins.map((origin, index) => (
                      <div
                        key={index}
                        className="border p-4 rounded-lg space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">
                            Wood Origin {index + 1}
                          </h4>
                          {index > 0 && (
                            <Button
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  woodOrigins: prev.woodOrigins.filter(
                                    (_, i) => i !== index
                                  ),
                                }));
                              }}
                              variant="destructive"
                              size="sm"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-4">
                          <div>
                            <Label className="text-base font-medium">
                              Country
                            </Label>
                            <select
                              value={origin.country}
                              onChange={(e) =>
                                handleWoodOriginChange(
                                  index,
                                  "country",
                                  e.target.value
                                )
                              }
                              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                              <option value="">Select Country</option>
                              <option value="USA">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="Brazil">Brazil</option>
                              <option value="Sweden">Sweden</option>
                              <option value="Finland">Finland</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Harvest Date & Time
                            </Label>
                            <Input
                              type="datetime-local"
                              value={formatDateForInput(origin.harvestDate)}
                              onChange={(e) =>
                                handleWoodOriginChange(
                                  index,
                                  "harvestDate",
                                  e.target.value
                                )
                              }
                              className="mt-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`area-${index}`}>
                              Area (hectares)
                            </Label>
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
                            <Label htmlFor={`description-${index}`}>
                              Description
                            </Label>
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
                          <div className="space-y-2">
                            <Label className="text-base font-medium">
                              GeoJSON File
                            </Label>
                            <Input
                              type="file"
                              accept=".geojson,application/json"
                              data-index={index}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleGeoJsonUpload(index, file);
                                }
                              }}
                              className="mt-2"
                            />
                            {origin.geojsonFile && (
                              <p className="text-sm text-green-600">
                                File selected: {origin.geojsonFile.name}
                              </p>
                            )}
                            {origin.geojsonData && (
                              <div className="mt-2 text-sm text-gray-600">
                                <p>
                                  Plots: {origin.geojsonData.features.length}
                                </p>
                                <p>
                                  Total Area:{" "}
                                  {origin.geojsonData.features.reduce(
                                    (sum: number, feature: any) =>
                                      sum + (feature.properties.hectare || 0),
                                    0
                                  )}{" "}
                                  hectares
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Transaction Documents" className="space-y-4">
                <div className="grid gap-6">
                  {[
                    {
                      name: "geoToProducerInvoice",
                      label: "Sale Invoice (Geolocation Owner to Producer)",
                    },
                    {
                      name: "woodTransportDocs",
                      label: "Wood Transportation Documents",
                    },
                    {
                      name: "producerToSupplierInvoice",
                      label: "Sale Invoice (Producer to Supplier)",
                    },
                    {
                      name: "pulpTransportDocs",
                      label: "Pulp Transportation Documents",
                    },
                    {
                      name: "supplierToITCInvoice",
                      label: "Sale Invoice (Supplier to ITC)",
                    },
                    {
                      name: "shippingDocs",
                      label: "Shipping Documents (BL, Customs)",
                    },
                    {
                      name: "ddsSummary",
                      label: "Due Diligence System (DDS) Summary",
                    },
                  ].map((doc) => (
                    <FileUploadField
                      key={doc.name}
                      name={doc.name as keyof FileData}
                      label={doc.label}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="Legal Documents" className="space-y-4">
                <div className="grid gap-6">
                  {[
                    {
                      name: "legalHarvestDocs",
                      label: "Legal Rights to Harvest Documents",
                    },
                    {
                      name: "fscCertificates",
                      label: "FSC CW-FM Certificates",
                    },
                    {
                      name: "fscCocCertificate",
                      label: "FSC CoC Certificate of Supplier",
                    },
                    {
                      name: "producerDeclaration",
                      label: "Producer Declaration",
                    },
                    {
                      name: "producerLicense",
                      label: "Business License of Producer",
                    },
                    {
                      name: "supplierLicense",
                      label: "Business License of Supplier",
                    },
                  ].map((doc) => (
                    <FileUploadField
                      key={doc.name}
                      name={doc.name as keyof FileData}
                      label={doc.label}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="Compliance" className="space-y-4">
                <div className="grid gap-6">
                  {[
                    {
                      name: "ghgCertifications",
                      label: "GHG Emissions Certifications",
                    },
                    {
                      name: "safetyCertifications",
                      label: "Health & Safety Certifications",
                    },
                    {
                      name: "humanRightsPolicies",
                      label: "Human Rights Policies",
                    },
                    {
                      name: "employeeRecords",
                      label: "Employee Records & Benefits",
                    },
                  ].map((doc) => (
                    <FileUploadField
                      key={doc.name}
                      name={doc.name as keyof FileData}
                      label={doc.label}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="Review" className="space-y-6">
                <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                      Basic Information
                    </h3>
                    <div className="grid gap-3">
                      <p>
                        <span className="font-medium">Pulp Type:</span>{" "}
                        {formData.pulpType || ""}
                      </p>
                      <p>
                        <span className="font-medium">Commodities:</span>{" "}
                        {formData.commodities || ""}
                      </p>
                      <p>
                        <span className="font-medium">Common Name:</span>{" "}
                        {formData.commonName || ""}
                      </p>
                      <p>
                        <span className="font-medium">Scientific Name:</span>{" "}
                        {formData.scientificName || ""}
                      </p>
                      <p>
                        <span className="font-medium">Quantity:</span>{" "}
                        {formData.quantity || ""} MT
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                      Location Details
                    </h3>
                    <div className="grid gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Supplier Details</h4>
                        {formData.suppliers.map((supplier, index) => (
                          <div
                            key={index}
                            className="mb-4 p-3 bg-white rounded"
                          >
                            <p className="font-medium">Supplier {index + 1}</p>
                            <p>Name: {supplier.name || ""}</p>
                            <p>Email: {supplier.email || ""}</p>
                            <p>Country: {supplier.country || ""}</p>
                            <p>Region: {supplier.region || ""}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Producer Details</h4>
                        {formData.producers.map((producer, index) => (
                          <div
                            key={index}
                            className="mb-4 p-3 bg-white rounded"
                          >
                            <p className="font-medium">Producer {index + 1}</p>
                            <p>Name: {producer.name || ""}</p>
                            <p>Email: {producer.email || ""}</p>
                            <p>Country: {producer.country || ""}</p>
                            <p>Region: {producer.region || ""}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                      Wood Origin Details
                    </h3>
                    <div className="grid gap-6">
                      {formData.woodOrigins.map((origin, index) => (
                        <div
                          key={index}
                          className="bg-white p-4 rounded-lg shadow-sm"
                        >
                          <h4 className="font-medium mb-3">
                            Wood Origin {index + 1}
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p>
                                <span className="font-medium">Country:</span>{" "}
                                {origin.country || "Not specified"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  Harvest Date:
                                </span>{" "}
                                {origin.harvestDate || "Not specified"}
                              </p>
                              <p>
                                <span className="font-medium">Area:</span>{" "}
                                {origin.area || 0} hectares
                              </p>
                              {origin.description && (
                                <p>
                                  <span className="font-medium">
                                    Description:
                                  </span>{" "}
                                  {origin.description}
                                </p>
                              )}
                            </div>
                            <div>
                              {origin.geojsonFile && (
                                <div className="space-y-2">
                                  <p className="font-medium">
                                    GeoJSON Information:
                                  </p>
                                  <p className="text-sm text-green-600">
                                    File: {origin.geojsonFile.name}
                                  </p>
                                  {origin.geojsonData && (
                                    <div className="mt-2">
                                      <p className="text-sm">
                                        <span className="font-medium">
                                          Number of Plots:
                                        </span>{" "}
                                        {origin.geojsonData.features.length}
                                      </p>
                                      <p className="text-sm">
                                        <span className="font-medium">
                                          Total Area:
                                        </span>{" "}
                                        {origin.geojsonData.features.reduce(
                                          (sum: number, feature: any) =>
                                            sum +
                                            (feature.properties.hectare || 0),
                                          0
                                        )}{" "}
                                        hectares
                                      </p>
                                      <div className="mt-2">
                                        <p className="font-medium text-sm">
                                          Plot Details:
                                        </p>
                                        <div className="max-h-40 overflow-y-auto">
                                          {origin.geojsonData.features.map(
                                            (
                                              feature: any,
                                              plotIndex: number
                                            ) => (
                                              <div
                                                key={plotIndex}
                                                className="text-sm border-b py-1"
                                              >
                                                <p>
                                                  Plot ID:{" "}
                                                  {feature.properties.plot_ID}
                                                </p>
                                                <p>
                                                  Farmer:{" "}
                                                  {
                                                    feature.properties
                                                      .farmer_name
                                                  }
                                                </p>
                                                <p>
                                                  Area:{" "}
                                                  {feature.properties.hectare}{" "}
                                                  hectares
                                                </p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                      Uploaded Documents
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(fileData)
                        .filter(([_, value]) => value !== null)
                        .map(([key, value]) => (
                          <p
                            key={key}
                            className="flex items-center text-green-600"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {key}: {value?.name}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-between mt-8">
            <Button
              onClick={() => {
                const currentIndex = sections.indexOf(activeTab);
                if (currentIndex > 0) {
                  setActiveTab(sections[currentIndex - 1]);
                }
              }}
              disabled={activeTab === sections[0]}
              className="px-6"
            >
              Previous
            </Button>
            {activeTab === sections[sections.length - 1] ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const currentIndex = sections.indexOf(activeTab);
                  if (currentIndex < sections.length - 1) {
                    setActiveTab(sections[currentIndex + 1]);
                  }
                }}
                className="px-6"
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showGeoJSONPreview && currentGeoJSONIndex !== null && (
        <GeoJSONPreview
          geojsonData={formData.woodOrigins[currentGeoJSONIndex].geojsonData}
          onValidate={handleGeoJSONValidate}
          onClose={() => {
            setShowGeoJSONPreview(false);
            setCurrentGeoJSONIndex(null);
          }}
          onReset={() => {
            // Reset the GeoJSON data for the current index
            setFormData((prev) => {
              const woodOrigins = [...prev.woodOrigins];
              woodOrigins[currentGeoJSONIndex] = {
                ...woodOrigins[currentGeoJSONIndex],
                geojsonFile: null,
                geojsonData: null,
              };
              return { ...prev, woodOrigins };
            });
            // Reset the file input
            const fileInput = document.querySelector(
              `input[type="file"][data-index="${currentGeoJSONIndex}"]`
            ) as HTMLInputElement;
            if (fileInput) {
              fileInput.value = "";
            }
          }}
        />
      )}
    </div>
  );
}
