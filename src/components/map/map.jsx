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
import Searchbar from "../searchplace/searchbar";

const COUNTY_URL =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query?where=STATEABBRV='CA'&outFields=*&f=geojson";

const FIRE_URL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0/query?where=POOState='US-CA'&outFields=IncidentName,POOState,FireCause&f=geojson";

const COUNTY_META_URL =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0?f=json";

const FIRE_META_URL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0?f=json";

const getRiskColor = (score) => {
  if (score == null) return "#ccc";

  return score > 80 ? "#800026" :
         score > 60 ? "#BD0026" :
         score > 40 ? "#E31A1C" :
         score > 20 ? "#FC4E2A" :
         score > 10 ? "#FD8D3C" :
         score > 5  ? "#FEB24C" :
         score > 0  ? "#FED976" :
                      "#FFEDA0";
};

const MapDrawingHandler = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
};

const Legend = () => (
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
    <h4>Risk Score</h4>
    <div><span style={{ background: "#800026", padding: "0 8px" }}></span> 80+</div>
    <div><span style={{ background: "#BD0026", padding: "0 8px" }}></span> 60–80</div>
    <div><span style={{ background: "#E31A1C", padding: "0 8px" }}></span> 40–60</div>
    <div><span style={{ background: "#FC4E2A", padding: "0 8px" }}></span> 20–40</div>
    <div><span style={{ background: "#FD8D3C", padding: "0 8px" }}></span> 10–20</div>
    <div><span style={{ background: "#FEB24C", padding: "0 8px" }}></span> 5–10</div>
    <div><span style={{ background: "#FED976", padding: "0 8px" }}></span> 0–5</div>

    <hr />
    <div><span style={{ color: "red" }}>●</span> Wildfires</div>
    <div><span style={{ color: "yellow" }}>●</span> Selected Fires</div>
    <div><span style={{ color: "green" }}>■</span> Selection Box</div>
  </div>
);

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

  const [spatialQueryEnabled, setSpatialQueryEnabled] = useState(false);

  const mapRef = useRef();
  const position = [36.5, -119.5];

  useEffect(() => {
    fetch(COUNTY_URL).then(r => r.json()).then(setGeoData);
    fetch(FIRE_URL).then(r => r.json()).then(setFireData);
    fetch(COUNTY_META_URL).then(r => r.json()).then(setCountyMeta);
    fetch(FIRE_META_URL).then(r => r.json()).then(setFireMeta);
  }, []);

  const downloadJSON = (data, name) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const handleMapClick = (latlng) => {
    if (!spatialQueryEnabled) return;

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

  return (
    <div style={{ display: "flex", position: "relative" }}>
      <div style={{ width: "350px", padding: "10px", background: "#f4f4f4" }}>
        <h3>Feature Info</h3>

        {selectedFeature ? (
          <div>
            {"COUNTY" in selectedFeature ? (
              <>
                <p><b>County:</b> {selectedFeature.COUNTY}</p>
                <p><b>Risk Score:</b> {selectedFeature.RISK_SCORE}</p>
                <p><b>Risk Rating:</b> {selectedFeature.RISK_RATNG}</p>
              </>
            ) : (
              <>
                <p><b>Incident:</b> {selectedFeature.IncidentName}</p>
                <p><b>Cause:</b> {selectedFeature.FireCause}</p>
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

        <h3>Spatial Query</h3>

        <label>
          <input
            type="checkbox"
            checked={spatialQueryEnabled}
            onChange={(e) => {
              setSpatialQueryEnabled(e.target.checked);
              clearSelection();
            }}
          />
          Enable Spatial Query
        </label>

        {spatialQueryEnabled && (
          <>
            <p>Click twice to draw selection box</p>
            <p>Selected Fires: {selectedFires.length}</p>

            <button onClick={exportCSV}>Export CSV</button>
            <br /><br />
            <button onClick={clearSelection}>Clear Selection</button>
          </>
        )}
      </div>

      <div style={{ height: "800px", width: "100%", position: "relative" }}>
        <MapContainer center={position} zoom={6} ref={mapRef} style={{ height: "100%" }}>
          
          {spatialQueryEnabled && (
            <MapDrawingHandler onClick={handleMapClick} />
          )}

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
                    style={(feature) => ({
                      color: "black",
                      weight: 1,
                      fillOpacity: 0.6,
                      fillColor: getRiskColor(feature.properties.RISK_SCORE)
                    })}
                    onEachFeature={(f, layer) => {
                      layer.on("add", () => layer.bringToBack());
                      layer.on("click", () => setSelectedFeature(f.properties));

                      layer.on("mouseover", (e) => {
                        e.target.setStyle({ weight: 2, fillOpacity: 0.8 });
                      });

                      layer.on("mouseout", (e) => {
                        e.target.setStyle({ weight: 1, fillOpacity: 0.6 });
                      });
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

          <Searchbar />
        </MapContainer>

        <Legend />
      </div>
    </div>
  );
};

export default Map;