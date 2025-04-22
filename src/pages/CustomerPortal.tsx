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

interface FormData {
  // Basic Details
  tradeName: string | null;
  commodities: string | null;
  speciesNames: string | null;
  quantity: string | null;

  // Location Info
  supplierCountry: string | null;
  productionCountry: string | null;
  woodOriginCountry: string | null;
  geolocationPolygon: string | null;
  harvestDates: string | null;

  // Contact Details
  supplierDetails: string | null;
  producerDetails: string | null;
  geolocationOwnerDetails: string | null;
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
  tradeName: null,
  commodities: null,
  speciesNames: null,
  quantity: null,
  supplierCountry: null,
  productionCountry: null,
  woodOriginCountry: null,
  geolocationPolygon: null,
  harvestDates: null,
  supplierDetails: null,
  producerDetails: null,
  geolocationOwnerDetails: null,
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
  "Contact Details",
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

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
                    <Label className="text-base font-medium">
                      Trade Name & Type of Pulp
                    </Label>
                    <Input
                      name="tradeName"
                      value={formData.tradeName || ""}
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
                    <Label className="text-base font-medium">
                      Common Name & Full Scientific Name of Species
                    </Label>
                    <Input
                      name="speciesNames"
                      value={formData.speciesNames || ""}
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
                  <div>
                    <Label className="text-base font-medium">
                      Country & Region of Pulp Supplier
                    </Label>
                    <Input
                      name="supplierCountry"
                      value={formData.supplierCountry || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Country & Region of Pulp Production
                    </Label>
                    <Input
                      name="productionCountry"
                      value={formData.productionCountry || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Country & Region of Wood Origin
                    </Label>
                    <Input
                      name="woodOriginCountry"
                      value={formData.woodOriginCountry || ""}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Geolocation Polygon of Harvest Areas
                    </Label>
                    <Textarea
                      name="geolocationPolygon"
                      value={formData.geolocationPolygon || ""}
                      onChange={handleInputChange}
                      placeholder="Enter coordinates or description of harvest areas"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Date/Time Range of Harvesting
                    </Label>
                    <Input
                      name="harvestDates"
                      value={formData.harvestDates || ""}
                      onChange={handleInputChange}
                      placeholder="Enter harvest date range"
                      className="mt-2"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Contact Details" className="space-y-4">
                <div className="grid gap-6">
                  <div>
                    <Label className="text-base font-medium">
                      Pulp Supplier Details
                    </Label>
                    <Textarea
                      name="supplierDetails"
                      value={formData.supplierDetails || ""}
                      onChange={handleInputChange}
                      placeholder="Name, email, and postal address"
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Pulp Producer Details
                    </Label>
                    <Textarea
                      name="producerDetails"
                      value={formData.producerDetails || ""}
                      onChange={handleInputChange}
                      placeholder="Name, email, and postal address"
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      Geolocation Owner Details
                    </Label>
                    <Textarea
                      name="geolocationOwnerDetails"
                      value={formData.geolocationOwnerDetails || ""}
                      onChange={handleInputChange}
                      placeholder="Name, email, and postal address"
                      className="mt-2"
                      rows={4}
                    />
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
                        <span className="font-medium">Trade Name:</span>{" "}
                        {formData.tradeName || ""}
                      </p>
                      <p>
                        <span className="font-medium">Commodities:</span>{" "}
                        {formData.commodities || ""}
                      </p>
                      <p>
                        <span className="font-medium">Species Names:</span>{" "}
                        {formData.speciesNames || ""}
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
                    <div className="grid gap-3">
                      <p>
                        <span className="font-medium">Supplier Country:</span>{" "}
                        {formData.supplierCountry || ""}
                      </p>
                      <p>
                        <span className="font-medium">Production Country:</span>{" "}
                        {formData.productionCountry || ""}
                      </p>
                      <p>
                        <span className="font-medium">Wood Origin:</span>{" "}
                        {formData.woodOriginCountry || ""}
                      </p>
                      <p>
                        <span className="font-medium">Geolocation:</span>{" "}
                        {formData.geolocationPolygon || ""}
                      </p>
                      <p>
                        <span className="font-medium">Harvest Dates:</span>{" "}
                        {formData.harvestDates || ""}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                      Contact Information
                    </h3>
                    <div className="grid gap-3">
                      <p>
                        <span className="font-medium">Supplier Details:</span>{" "}
                        {formData.supplierDetails || ""}
                      </p>
                      <p>
                        <span className="font-medium">Producer Details:</span>{" "}
                        {formData.producerDetails || ""}
                      </p>
                      <p>
                        <span className="font-medium">Geolocation Owner:</span>{" "}
                        {formData.geolocationOwnerDetails || ""}
                      </p>
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
    </div>
  );
}
