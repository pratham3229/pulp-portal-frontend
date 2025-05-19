// GeoJSON Validator - Implements all rules from the validation rulebook
// Usage: import { validateGeoJSON } from './geojsonValidator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateGeoJSON(geojson: any): ValidationResult {
  const results: ValidationResult = { isValid: true, errors: [] };

  // Rule 1: Root type must be "FeatureCollection"
  if (!geojson || typeof geojson !== "object") {
    addError(results, "GeoJSON must be a valid object");
    return results;
  }
  if (geojson.type !== "FeatureCollection") {
    addError(results, "Root type must be 'FeatureCollection'");
    return results;
  }

  // Rule 2: "features" must be a non-empty array
  if (!Array.isArray(geojson.features) || geojson.features.length === 0) {
    addError(results, "'features' must be a non-empty array");
    return results;
  }

  geojson.features.forEach((feature: any, index: number) => {
    validateFeature(feature, index, results);
  });

  return results;
}

function validateFeature(
  feature: any,
  index: number,
  results: ValidationResult
) {
  // Rule 3: Each feature must have "type": "Feature"
  if (feature.type !== "Feature") {
    addError(results, `Feature ${index}: Type must be 'Feature'`);
    return;
  }

  // Rule 17: "properties" must be an object or null
  if (
    !("properties" in feature) ||
    (feature.properties !== null && typeof feature.properties !== "object")
  ) {
    addError(
      results,
      `Feature ${index}: 'properties' must be an object or null`
    );
    return;
  }

  // Rule 18: Required properties (example: country ISO2 code, plot_ID, etc.)
  // (You can customize requiredProps as needed)
  const requiredProps = ["plot_ID", "farmer_name"];
  requiredProps.forEach((prop) => {
    if (!feature.properties || !(prop in feature.properties)) {
      addError(
        results,
        `Feature ${index}: Missing required property '${prop}'`
      );
    }
  });

  // Rule 24: Property types must match expectation (example: area should be number)
  if (
    "area" in feature.properties &&
    typeof feature.properties.area !== "number"
  ) {
    addError(results, `Feature ${index}: 'area' property must be a number`);
  }

  // Rule 19: File must be valid JSON (already checked by parsing)

  // Rule 20: Syntax must be correct (no missing brackets/commas/typos) (already checked by parsing)

  // Rule 21: Geometry type must match platform expectation (only Polygon accepted)
  if (!feature.geometry && feature.geometry !== null) {
    addError(results, `Feature ${index}: Missing 'geometry' property`);
    return;
  }
  if (feature.geometry === null) return; // Null geometry allowed
  validateGeometry(feature.geometry, index, results);
}

function validateGeometry(
  geometry: any,
  featureIndex: number,
  results: ValidationResult
) {
  // Rule 4: Geometry type must be valid
  const validTypes = [
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
    "GeometryCollection",
  ];
  if (!geometry.type || !validTypes.includes(geometry.type)) {
    addError(results, `Feature ${featureIndex}: Invalid geometry type`);
    return;
  }
  // Rule 21: Only Polygon geometries are accepted for this implementation
  if (geometry.type !== "Polygon") {
    addError(
      results,
      `Feature ${featureIndex}: Only Polygon geometries are supported`
    );
    return;
  }
  // Rule 5: Coordinates must be correctly structured
  if (!Array.isArray(geometry.coordinates)) {
    addError(results, `Feature ${featureIndex}: Coordinates must be an array`);
    return;
  }
  validatePolygonCoordinates(geometry.coordinates, featureIndex, results);
}

function validatePolygonCoordinates(
  coordinates: any[][][],
  featureIndex: number,
  results: ValidationResult
) {
  // Rule 13: No interior rings allowed (holes strictly prohibited)
  if (coordinates.length > 1) {
    addError(
      results,
      `Feature ${featureIndex}: Interior rings (holes) are not allowed`
    );
    return;
  }
  if (coordinates.length === 0) {
    addError(
      results,
      `Feature ${featureIndex}: Polygon must have an exterior ring`
    );
    return;
  }
  // Validate the exterior ring
  validateRing(coordinates[0], featureIndex, 0, results);
}

function validateRing(
  ring: any[][],
  featureIndex: number,
  ringIndex: number,
  results: ValidationResult
) {
  // Rule 6: Ring must be closed (first/last points identical)
  if (!pointsEqual(ring[0], ring[ring.length - 1])) {
    addError(
      results,
      `Feature ${featureIndex}: Ring must be closed (first/last points identical)`
    );
  }
  // Rule 7: Must have at least 4 points (including closure)
  if (ring.length < 4) {
    addError(
      results,
      `Feature ${featureIndex}: Ring must have at least 4 points`
    );
    return;
  }
  // Rule 14: No duplicate consecutive coordinates
  for (let i = 1; i < ring.length; i++) {
    if (pointsEqual(ring[i], ring[i - 1])) {
      addError(
        results,
        `Feature ${featureIndex}: Duplicate consecutive points at ${
          i - 1
        } and ${i}`
      );
    }
  }
  // Rule 16: No zero-length edges (identical adjacent points)
  for (let i = 1; i < ring.length; i++) {
    if (pointsEqual(ring[i], ring[i - 1])) {
      addError(
        results,
        `Feature ${featureIndex}: Zero-length edge at points ${i - 1} and ${i}`
      );
    }
  }
  // Validate individual coordinates
  ring.forEach((coord, pointIndex) => {
    validateCoordinate(coord, featureIndex, ringIndex, pointIndex, results);
  });
  // Rule 12: No self-intersections
  checkSelfIntersections(ring, featureIndex, results);
  // Rule 15: No spike vertices (angles < 5°)
  checkForSpikes(ring, featureIndex, results);
  // Rule 22: No excessive straight lines (enough points for curves)
  checkExcessiveStraightLines(ring, featureIndex, results);
}

function validateCoordinate(
  coord: any[],
  featureIndex: number,
  ringIndex: number,
  pointIndex: number,
  results: ValidationResult
) {
  // Rule 8: Coordinate format [lon, lat] or [lon, lat, alt]
  if (!Array.isArray(coord) || coord.length < 2 || coord.length > 3) {
    addError(
      results,
      `Feature ${featureIndex} Point ${pointIndex}: Invalid coordinate format`
    );
    return;
  }
  const [lon, lat] = coord;
  // Rule 9: Longitude must be between -180 and 180
  if (typeof lon !== "number" || lon < -180 || lon > 180) {
    addError(
      results,
      `Feature ${featureIndex} Point ${pointIndex}: Invalid longitude ${lon}`
    );
  }
  // Rule 10: Latitude must be between -90 and 90
  if (typeof lat !== "number" || lat < -90 || lat > 90) {
    addError(
      results,
      `Feature ${featureIndex} Point ${pointIndex}: Invalid latitude ${lat}`
    );
  }
  // Rule 11: Coordinate precision <= 6 decimal places
  if (hasExcessivePrecision(lon) || hasExcessivePrecision(lat)) {
    addError(
      results,
      `Feature ${featureIndex} Point ${pointIndex}: Excessive coordinate precision`
    );
  }
}

function checkSelfIntersections(
  ring: any[][],
  featureIndex: number,
  results: ValidationResult
) {
  // This is a simplified implementation - for production use turf.js
  for (let i = 0; i < ring.length - 1; i++) {
    for (let j = i + 2; j < ring.length - 1; j++) {
      if (i === 0 && j === ring.length - 2) continue; // skip adjacent edges
      if (segmentsIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
        addError(
          results,
          `Feature ${featureIndex}: Self-intersection detected`
        );
        return;
      }
    }
  }
}

function checkForSpikes(
  ring: any[][],
  featureIndex: number,
  results: ValidationResult
) {
  for (let i = 1; i < ring.length - 1; i++) {
    const angle = calculateAngle(ring[i - 1], ring[i], ring[i + 1]);
    if (angle < 5) {
      addError(
        results,
        `Feature ${featureIndex}: Spike vertex detected (${angle.toFixed(1)}°)`
      );
    }
  }
}

function checkExcessiveStraightLines(
  ring: any[][],
  featureIndex: number,
  results: ValidationResult
) {
  // Rule 22: No excessive straight lines (enough points for curves)
  // If the polygon has only 3-4 points for a large, curved boundary, warn
  if (ring.length <= 4) {
    addError(
      results,
      `Feature ${featureIndex}: Polygon may have excessive straight lines (not enough points for curves)`
    );
  }
}

// Helper functions
function addError(results: ValidationResult, message: string) {
  results.isValid = false;
  results.errors.push(message);
}

function pointsEqual(p1: any[], p2: any[]) {
  return p1.length === p2.length && p1.every((val, i) => val === p2[i]);
}

function hasExcessivePrecision(num: number) {
  const str = num.toString();
  const decimalPart = str.includes(".") ? str.split(".")[1] : "";
  return decimalPart.length > 6;
}

function calculateAngle(p1: number[], p2: number[], p3: number[]) {
  const v1 = [p1[0] - p2[0], p1[1] - p2[1]];
  const v2 = [p3[0] - p2[0], p3[1] - p2[1]];
  const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
  const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
  const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
  if (mag1 === 0 || mag2 === 0) return 180;
  const cosTheta = Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

function segmentsIntersect(
  p1: number[],
  p2: number[],
  p3: number[],
  p4: number[]
) {
  const ccw = (a: number[], b: number[], c: number[]) => {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  };
  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}
