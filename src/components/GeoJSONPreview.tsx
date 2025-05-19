import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  validateGeoJSONWithSteps,
  ValidationResultWithSteps,
  validateAllPlotsWithSteps,
  PerPlotValidationResult,
} from "../utils/geojsonValidatorWithSteps";

interface PlotProperties {
  plot_ID: string;
  farmer_name: string;
  hectare: number;
}

interface GeoJSONFeature {
  type: "Feature";
  properties: PlotProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface GeoJSONPreviewProps {
  geojsonData: GeoJSONData;
  onValidate: (selectedPlots: GeoJSONFeature[]) => void;
  onClose: () => void;
  onReset: () => void;
}

const defaultCenter = {
  lat: 16.715037365381534,
  lng: 80.25209974497557,
};

// Custom grid layer for detailed grid lines
const GridOverlay = () => {
  const map = useMap();

  useEffect(() => {
    // Add base map layer
    const baseLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }
    );

    // Add grid overlay layer
    const gridLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
        opacity: 0.5,
      }
    );

    // Add layers to map
    baseLayer.addTo(map);
    gridLayer.addTo(map);

    return () => {
      map.removeLayer(baseLayer);
      map.removeLayer(gridLayer);
    };
  }, [map]);

  return null;
};

// Component to handle map bounds and plot selection
function MapController({
  geojsonData,
  selectedPlotId,
}: {
  geojsonData: GeoJSONData;
  selectedPlotId: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (!geojsonData.features.length) return;

    const selectedFeature = geojsonData.features.find(
      (feature) => feature.properties.plot_ID === selectedPlotId
    );

    if (selectedFeature) {
      const coordinates = selectedFeature.geometry.coordinates[0];
      const bounds = coordinates.reduce((bounds, [lng, lat]) => {
        return bounds.extend([lat, lng] as L.LatLngExpression);
      }, new L.LatLngBounds([]));

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 18,
      });
    } else {
      // If no plot is selected, show all plots
      const bounds = geojsonData.features.reduce((bounds, feature) => {
        feature.geometry.coordinates[0].forEach(([lng, lat]) => {
          bounds.extend([lat, lng] as L.LatLngExpression);
        });
        return bounds;
      }, new L.LatLngBounds([]));

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
      });
    }
  }, [geojsonData, selectedPlotId, map]);

  return null;
}

// Helper function to convert coordinates to Leaflet format
const convertToLatLng = (coordinates: number[][][]): L.LatLngExpression[][] => {
  return coordinates.map((ring) =>
    ring.map(([lng, lat]) => [lat, lng] as L.LatLngExpression)
  );
};

export function GeoJSONPreview({
  geojsonData,
  onValidate,
  onClose,
  onReset,
}: GeoJSONPreviewProps) {
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");
  const [validatedPlots, setValidatedPlots] = useState<string[]>([]);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResultWithSteps | null>(null);
  const [perPlotResults, setPerPlotResults] = useState<
    PerPlotValidationResult[] | null
  >(null);
  const [isValidating, setIsValidating] = useState(false);

  // Get the selected plot from the GeoJSON data
  const selectedPlot = geojsonData.features.find(
    (feature) => feature.properties.plot_ID === selectedPlotId
  );

  const handleValidate = () => {
    if (!selectedPlot) return;
    setValidatedPlots((prev) =>
      prev.includes(selectedPlot.properties.plot_ID)
        ? prev
        : [...prev, selectedPlot.properties.plot_ID]
    );
  };

  const handleComplete = () => {
    const validatedFeatures = geojsonData.features.filter((feature) =>
      validatedPlots.includes(feature.properties.plot_ID)
    );
    onValidate(validatedFeatures);
    onClose();
  };

  const isPlotValidated = (plotId: string) => validatedPlots.includes(plotId);

  // New: Validate all plots with spinner and per-plot results
  const handleValidateAllPlots = async () => {
    setIsValidating(true);
    setTimeout(() => {
      // Simulate async/spinner UX
      const results = validateAllPlotsWithSteps(geojsonData);
      setPerPlotResults(results);
      setValidationModalOpen(true);
      setIsValidating(false);
    }, 600); // 600ms spinner for UX
  };

  // Helper to get per-plot validation result by plotId
  const getPlotValidation = (plotId: string) => {
    if (!perPlotResults) return null;
    return perPlotResults.find((p) => p.plotId === plotId) || null;
  };

  const getCommonIssues = (results: PerPlotValidationResult[]): string => {
    const errorCounts: { [key: string]: number } = {};
    results.forEach((plot) => {
      plot.errors.forEach((error) => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    });

    const sortedErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([error]) => error);

    return sortedErrors.join(", ") || "No common issues found";
  };

  const handleFixPlot = (plotId: string) => {
    setValidationModalOpen(false);
    setSelectedPlotId(plotId);
  };

  if (validationModalOpen && perPlotResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">GeoJSON Validation Results</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {perPlotResults.filter((p) => p.isValid).length} of{" "}
                {perPlotResults.length} plots valid
              </span>
              <div className="h-4 w-4 rounded-full bg-gray-200">
                <div
                  className="h-4 w-4 rounded-full bg-green-500"
                  style={{
                    width: `${
                      (perPlotResults.filter((p) => p.isValid).length /
                        perPlotResults.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Validation Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Validation Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Plots</p>
                <p className="text-lg font-medium">{perPlotResults.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid Plots</p>
                <p className="text-lg font-medium text-green-600">
                  {perPlotResults.filter((p) => p.isValid).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invalid Plots</p>
                <p className="text-lg font-medium text-red-600">
                  {perPlotResults.filter((p) => !p.isValid).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Common Issues</p>
                <p className="text-sm text-gray-700">
                  {getCommonIssues(perPlotResults)}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-4">
            {perPlotResults.map((plot) => (
              <div
                key={plot.plotId}
                className={`rounded-lg p-4 border ${
                  plot.isValid
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
                }`}
              >
                <div className="flex items-center mb-2">
                  <span
                    className={`mr-2 text-lg ${
                      plot.isValid ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {plot.isValid ? "✅" : "❌"}
                  </span>
                  <span className="font-semibold">Plot {plot.plotId}</span>
                  {plot.farmer && (
                    <span className="ml-2 text-gray-600">({plot.farmer})</span>
                  )}
                </div>
                {plot.isValid ? (
                  <div className="text-green-700">Valid</div>
                ) : (
                  <ul className="list-disc ml-6 text-red-700">
                    {plot.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <div className="space-x-2">
              <Button
                onClick={() => {
                  setValidationModalOpen(false);
                  onReset();
                  onClose();
                }}
                variant="outline"
              >
                Re-upload File
              </Button>
            </div>
            <div className="space-x-2">
              <Button
                onClick={() => setValidationModalOpen(false)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 h-5/6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Plot Selection Preview
          </h2>
          <div className="space-x-3">
            <Button
              onClick={handleValidateAllPlots}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isValidating}
            >
              {isValidating ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Validating...
                </span>
              ) : (
                "Validate All Plots"
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-gray-50 rounded-lg p-6 flex flex-col">
            <div className="mb-6 w-full">
              <Select value={selectedPlotId} onValueChange={setSelectedPlotId}>
                <SelectTrigger className="w-full h-12 text-lg">
                  <SelectValue placeholder="Select a plot" />
                </SelectTrigger>
                <SelectContent>
                  {geojsonData.features.map((feature) => (
                    <SelectItem
                      key={feature.properties.plot_ID}
                      value={feature.properties.plot_ID}
                      className="text-lg py-2"
                    >
                      Plot {feature.properties.plot_ID} -{" "}
                      {feature.properties.farmer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Leaflet Map Component */}
            <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={[defaultCenter.lat, defaultCenter.lng]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                zoomControl={true}
                attributionControl={true}
              >
                <GridOverlay />
                <MapController
                  geojsonData={geojsonData}
                  selectedPlotId={selectedPlotId}
                />
                {geojsonData.features.map((feature) => {
                  const isSelected =
                    feature.properties.plot_ID === selectedPlotId;
                  return (
                    <Polygon
                      key={feature.properties.plot_ID}
                      positions={convertToLatLng(feature.geometry.coordinates)}
                      pathOptions={{
                        fillColor: isSelected ? "#4CAF50" : "#FFC107",
                        fillOpacity: isSelected ? 0.5 : 0.3,
                        color: isSelected ? "#388E3C" : "#FFA000",
                        weight: 2,
                        dashArray: isSelected ? undefined : "5, 5",
                      }}
                      eventHandlers={{
                        click: () =>
                          setSelectedPlotId(feature.properties.plot_ID),
                        mouseover: (e) => {
                          const layer = e.target;
                          layer.setStyle({
                            fillOpacity: 0.7,
                            weight: 3,
                          });
                        },
                        mouseout: (e) => {
                          const layer = e.target;
                          layer.setStyle({
                            fillOpacity: isSelected ? 0.5 : 0.3,
                            weight: 2,
                          });
                        },
                      }}
                    />
                  );
                })}
              </MapContainer>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <h3 className="font-medium text-lg mb-4 text-gray-800">
                Plot Details
              </h3>
              {selectedPlot ? (
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="font-medium text-lg mb-2">
                    Plot ID: {selectedPlot.properties.plot_ID}
                  </p>
                  <p className="text-gray-700 mb-2">
                    Farmer: {selectedPlot.properties.farmer_name}
                  </p>
                  <p className="text-gray-700">
                    Area: {selectedPlot.properties.hectare} hectares
                  </p>
                  {isPlotValidated(selectedPlot.properties.plot_ID) && (
                    <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-md text-sm">
                      ✓ Plot validated
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No plot selected</p>
              )}

              <div className="mt-6">
                <h4 className="font-medium text-lg mb-4 text-gray-800">
                  Validation Progress
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {geojsonData.features.map((feature) => (
                    <div
                      key={feature.properties.plot_ID}
                      className={`p-3 rounded-lg ${
                        isPlotValidated(feature.properties.plot_ID)
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="font-medium">
                        Plot {feature.properties.plot_ID}
                      </div>
                      <div className="text-sm">
                        {feature.properties.farmer_name}
                      </div>
                      {isPlotValidated(feature.properties.plot_ID) && (
                        <div className="text-sm mt-1">✓ Validated</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
