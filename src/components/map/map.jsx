import React, { useRef } from 'react'
import { MapContainer, TileLayer, LayersControl, LayerGroup } from 'react-leaflet'
import "leaflet/dist/leaflet.css";

const Map = () => {

  const mapRef = useRef();
  const position = [36.966428, -95.844032];
  return (
    <>
        <div style={{height: "800px"}}>
            <h4>AVN Exercise</h4>
                
            <MapContainer 
                center={position} 
                zoom={5} 
                scrollWheelZoom={true}
                ref={mapRef}
                style={{height: "100%", width: "100%"}}
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
                           attribution='Tiles &copy; Esri &mdash; Source: Esri'
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
                      attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                  </LayersControl.BaseLayer>
               </LayersControl>
            </MapContainer>
        </div>
        
    </>
  )
}

export default Map