import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  LayerGroup,
  GeoJSON,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const COUNTY_URL =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query?where=STATEABBRV='CA'&outFields=*&f=geojson";

const FIRE_URL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0/query?where=POOState='US-CA'&outFields=IncidentName,POOState,FireCause&f=geojson";

const COUNTY_META_URL =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0?f=json";

const FIRE_META_URL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0?f=json";

// Map click handler
const MapDrawingHandler = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
};

// Legend Component
const Legend = () => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        background: "white",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 0 6px rgba(0,0,0,0.3)",
        fontSize: "12px",
        zIndex: 1000
      }}
    >
      <h4>Legend</h4>
      <div><span style={{ color: "blue" }}>■</span> Counties</div>
      <div><span style={{ color: "red" }}>●</span> Wildfires</div>
      <div><span style={{ color: "yellow" }}>●</span> Selected Fires</div>
      <div><span style={{ color: "green" }}>■</span> Selection Box</div>
    </div>
  );
};

const Map = () => {
  const [geoData, setGeoData] = useState(null);
  const [fireData, setFireData] = useState(null);
  const [countyMeta, setCountyMeta] = useState(null);
  const [fireMeta, setFireMeta] = useState(null);

  const [selectedFeature, setSelectedFeature] = useState(null);

  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [selectedFires, setSelectedFires] = useState([]);

  const mapRef = useRef();
  const position = [36.5, -119.5];

  useEffect(() => {
    fetch(COUNTY_URL).then(r => r.json()).then(setGeoData);
    fetch(FIRE_URL).then(r => r.json()).then(setFireData);
    fetch(COUNTY_META_URL).then(r => r.json()).then(setCountyMeta);
    fetch(FIRE_META_URL).then(r => r.json()).then(setFireMeta);
  }, []);

  const handleMapClick = (latlng) => {
    if (!drawing) {
      setStartPoint(latlng);
      setDrawing(true);
    } else {
      const newBounds = L.latLngBounds(startPoint, latlng);
      setBounds(newBounds);
      setDrawing(false);

      if (!fireData) return;

      const selected = fireData.features.filter(f => {
        const [lon, lat] = f.geometry.coordinates;
        return newBounds.contains([lat, lon]);
      });

      setSelectedFires(selected);
    }
  };

  const clearSelection = () => {
    setBounds(null);
    setSelectedFires([]);
    setDrawing(false);
    setStartPoint(null);
  };

  const exportCSV = () => {
    const rows = selectedFires.map(f => f.properties);
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csv =
      headers.join(",") +
      "\n" +
      rows.map(r => headers.map(h => r[h]).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "selected_fires.csv";
    a.click();
  };

  const downloadJSON = (data, name) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  return (
    <div style={{ display: "flex", position: "relative" }}>
      <div style={{ width: "350px", padding: "10px", background: "#f4f4f4" }}>
        <h3>Feature Info</h3>

        {selectedFeature ? (
          <div>
            {"COUNTY" in selectedFeature ? (
              <>
                <p><b>OBJECTID:</b> {selectedFeature.OBJECTID ?? "N/A"}</p>
                <p><b>County:</b> {selectedFeature.COUNTY ?? "N/A"}</p>
                <p><b>Risk Rating:</b> {selectedFeature.RISK_RATNG ?? "N/A"}</p>
              </>
            ) : (
              <>
                <p><b>Incident:</b> {selectedFeature.IncidentName ?? "N/A"}</p>
                <p><b>State:</b> {selectedFeature.POOState ?? "N/A"}</p>
                <p><b>Cause:</b> {selectedFeature.FireCause ?? "N/A"}</p>
              </>
            )}
          </div>
        ) : (
          <p>Click a feature</p>
        )}

        <h3>Metadata</h3>

        {countyMeta && (
          <>
            <p><b>Counties:</b> {countyMeta.description || "N/A"}</p>
            <button onClick={() => downloadJSON(countyMeta, "county_meta.json")}>
              Download Counties Metadata
            </button>
          </>
        )}

        {fireMeta && (
          <>
            <p><b>Wildfires:</b> {fireMeta.description || "N/A"}</p>
            <button onClick={() => downloadJSON(fireMeta, "fire_meta.json")}>
              Download Fire Metadata
            </button>
          </>
        )}

        <h3>Spatial Query (Square)</h3>
        <p>Click once to start, click again to finish</p>
        <p>Selected Fires: {selectedFires.length}</p>

        <button onClick={exportCSV}>Export CSV</button>
        <br /><br />
        <button onClick={clearSelection}>Clear Selection</button>
      </div>

      <div style={{ height: "800px", width: "100%", position: "relative" }}>
        <MapContainer center={position} zoom={6} ref={mapRef} style={{ height: "100%" }}>
          
          <MapDrawingHandler onClick={handleMapClick} />

          <LayersControl position="topright">

            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Satellite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Dark">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>

            <LayersControl.Overlay checked name="Counties">
              <LayerGroup>
                {geoData && (
                  <GeoJSON
                    data={geoData}
                    style={{ color: "blue", weight: 1, fillOpacity: 0.2 }}
                    onEachFeature={(f, layer) => {
                      layer.on("add", () => layer.bringToBack());
                      layer.on("click", () => setSelectedFeature(f.properties));
                    }}
                  />
                )}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Fires">
              <LayerGroup>
                {fireData && (
                  <GeoJSON
                    data={fireData}
                    pointToLayer={(f, latlng) =>
                      L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: "red",
                        fillOpacity: 0.9,
                        color: "black"
                      })
                    }
                    onEachFeature={(f, layer) => {
                      layer.on("add", () => layer.bringToFront());
                      layer.on("click", () => setSelectedFeature(f.properties));
                    }}
                  />
                )}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Selection Box">
              <LayerGroup>
                {bounds && (
                  <GeoJSON
                    data={{
                      type: "Feature",
                      geometry: {
                        type: "Polygon",
                        coordinates: [[
                          [bounds.getWest(), bounds.getSouth()],
                          [bounds.getEast(), bounds.getSouth()],
                          [bounds.getEast(), bounds.getNorth()],
                          [bounds.getWest(), bounds.getNorth()],
                          [bounds.getWest(), bounds.getSouth()]
                        ]]
                      }
                    }}
                    style={{ color: "green", weight: 2, fillOpacity: 0.4 }}
                  />
                )}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Selected Fires">
              <LayerGroup>
                {selectedFires.length > 0 && (
                  <GeoJSON
                    data={{
                      type: "FeatureCollection",
                      features: selectedFires
                    }}
                    pointToLayer={(f, latlng) =>
                      L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: "yellow",
                        fillOpacity: 0.9,
                        color: "black"
                      })
                    }
                  />
                )}
              </LayerGroup>
            </LayersControl.Overlay>

          </LayersControl>
        </MapContainer>

        <Legend />
      </div>
    </div>
  );
};

export default Map;