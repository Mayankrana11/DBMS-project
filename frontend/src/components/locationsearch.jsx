import { useState } from "react";

function LocationSearch({ placeholder, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const searchLocation = async (value) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${value}`
    );

    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="relative mb-3">
      <input
        className="w-full p-3 border rounded-lg"
        placeholder={placeholder}
        value={query}
        onChange={(e) => searchLocation(e.target.value)}
      />

      {results.length > 0 && (
        <div className="absolute bg-white border w-full mt-1 max-h-40 overflow-y-auto z-50 rounded-lg shadow">
          {results.map((item, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => {
                setQuery(item.display_name);
                setResults([]);

                onSelect({
                  name: item.display_name,
                  lat: parseFloat(item.lat),
                  lon: parseFloat(item.lon),
                });
              }}
            >
              {item.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationSearch;