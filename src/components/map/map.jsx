import React, { useRef, useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  LayerGroup,
  GeoJSON
} from 'react-leaflet';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

const Map = () => {

  const [geoData, setGeoData] = useState(null);
  const [fireData, setFireData] = useState(null);

  const mapRef = useRef();
  const position = [36.966428, -95.844032];

  useEffect(() => {
    fetch(
      "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query?where=STATEABBRV='CA'&outFields=*&f=geojson"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("County Features:", data.features.length);
        setGeoData(data);
      })
      .catch((err) => console.error("Failed to Load County Data", err));
  }, []);

  useEffect(() => {
    fetch(
      "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0/query?where=POOState='US-CA'&outFields=IncidentName,POOState,FireCause&f=geojson"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Wildfire Features:", data.features.length);
        setFireData(data);
      })
      .catch((err) => console.error("Failed to Load Fire Data", err));
  }, []);

  return (
    <div style={{ height: "800px" }}>
      <h4>AVN Exercise</h4>

      <MapContainer
        center={position}
        zoom={5}
        scrollWheelZoom={true}
        ref={mapRef}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">

          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Esri Satellite">
            <LayerGroup>
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer
                attribution='Labels &copy; Esri'
                url="https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              />
            </LayerGroup>
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="CartoDB Dark">
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="CA Counties">
            <LayerGroup>
              {geoData && (
                <GeoJSON
                  data={geoData}
                  style={(feature) => ({
                    fillColor: "#2b8cbe",
                    color: "white",
                    weight: 1,
                    fillOpacity: 0.25
                  })}
                  onEachFeature={(feature, layer) => {
                    const props = feature.properties;

                    layer.on("add", () => {
                      layer.bringToBack();
                    });

                    layer.bindPopup(`
                      County: ${props.COUNTY || "N/A"}<br/>
                      Risk Score: ${props.RISK_SCORE ?? "N/A"}<br/>
                      OBJECTID: ${props.OBJECTID ?? "N/A"}
                    `);
                  }}
                />
              )}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Wildfires">
            <LayerGroup>
              {fireData && (
                <GeoJSON
                  data={fireData}
                  pointToLayer={(feature, latlng) =>
                    L.circleMarker(latlng, {
                      radius: 6,
                      fillColor: "red",
                      color: "#800000",
                      weight: 1,
                      fillOpacity: 0.9
                    })
                  }
                  onEachFeature={(feature, layer) => {
                    const props = feature.properties;

                    layer.bindPopup(`
                      Incident: ${props.IncidentName || "N/A"}<br/>
                      State: ${props.POOState || "N/A"}<br/>
                      Cause: ${props.FireCause || "N/A"}
                    `);
                  }}
                />
              )}
            </LayerGroup>
          </LayersControl.Overlay>

        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default Map;