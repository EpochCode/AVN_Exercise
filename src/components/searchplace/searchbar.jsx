import React, { useState } from 'react'
import { useMap } from 'react-leaflet'
import { OpenStreetMapProvider } from 'leaflet-geosearch'
import L from "leaflet"
import { FiSearch } from 'react-icons/fi'

const SearchBar = () => {

   const map = useMap()
   const provider = new OpenStreetMapProvider();

   const [query, setQuery] = useState("");
   const [visible, setVisible] = useState(false)
   const [markerRef, setMarkerRef] = useState(null)

   L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
   })

   const handleSearch = async (e) => {
      e.preventDefault();

      try {
         const results = await provider.search({ query });

         if (results.length > 0) {
            const { x, y, label } = results[0];
            const latLng = [y, x];
            map.flyTo([y, x], 14);

            if (markerRef) {
               map.removeLayer(markerRef)
            }

            const newMarker = L.marker(latLng)
               .addTo(map)
               .bindPopup(label)
               .openPopup();

            setMarkerRef(newMarker);
            setVisible(false)
            setQuery("");
         } else {
            alert("No results found");
         }
      } catch (error) {
         console.error(error)
         alert("Search Failed")
      }
   }
   return (
      <div style={{ position: "absolute", top: 210, right: 10, zIndex: 1000 }}>
         {!visible ? (
            <button
               onClick={() => setVisible(true)}
               style={{
                  background: "white",
                  border: "1px solid #ccc",
                  padding: "6px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
               }}
            >
               <FiSearch />
            </button>
         ) : (
            <form
               onSubmit={handleSearch}
               style={{
                  display: "flex",
                  alignItems: "center",
                  background: "white",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  boxShadow: "0, 2px, 6px rgba(0,0,0,0.2)",
                  padding: "2px",
               }}
            >

               <input
                  type='text'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search...'
                  autoFocus
                  style={{
                     border: "none",
                     padding: "6px",
                     width: "160px",
                     outline: "none"
                  }} />

               <button
                  type='submit'
                  style={{
                     background: "none",
                     border: "none",
                     padding: "6px",
                     cursor: "pointer"
                  }}
               >
                  <FiSearch />
               </button>
               <button
                  type='button'
                  onClick={() => setVisible(false)}
                  style={{
                     background: 'none',
                     border: 'none',
                     padding: '6px',
                     cursor: 'pointer',
                     fontSize: '16px',
                  }}
               ></button>
            </form>
         )}
      </div>
   )
}

export default SearchBar