"use client";

import { useState, useEffect } from "react";
import RestaurantCard from "../components/RestaurantCard";

export default function Restaurants() {
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [minSeats, setMinSeats] = useState(0);
  const [priceRange, setPriceRange] = useState("");
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [cities, setCities] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const res = await fetch("/data/restaurants.json");
      const data = await res.json();
      setRestaurants(data.restaurants);

      const uniqueCities = [...new Set(data.restaurants.map((r) => r.city))];
      setCities(uniqueCities.sort());
    };

    fetchRestaurants();
  }, []);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  const filteredRestaurants = restaurants
    .filter((r) => (city ? r.city === city : true))
    .filter((r) => r.rating >= minRating)
    .filter((r) => r.seats >= minSeats)
    .filter((r) => (priceRange ? r.price_range === priceRange : true))
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const visibleRestaurants = filteredRestaurants.slice(0, visibleCount);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="bg-[#E6F0EC] p-6 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row justify-center gap-6 flex-wrap items-end max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-1 min-w-[150px]">
            <label className="mb-1 text-sm font-medium text-gray-700">Grad</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border p-2 rounded-md w-full h-10"
            >
              <option value="">Sve</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col md:flex-1 min-w-[120px]">
            <label className="mb-1 text-sm font-medium text-gray-700">Ocjena</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="border p-2 rounded-md w-full h-10"
            >
              <option value={0}>Sve</option>
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-1 min-w-[120px]">
            <label className="mb-1 text-sm font-medium text-gray-700">Broj mjesta</label>
            <input
              type="number"
              min="0"
              value={minSeats}
              onChange={(e) => setMinSeats(Number(e.target.value))}
              placeholder="0+"
              className="border p-2 rounded-md w-full h-10"
            />
          </div>
          <div className="flex flex-col md:flex-1 min-w-[120px]">
            <label className="mb-1 text-sm font-medium text-gray-700">Cijena</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="border p-2 rounded-md w-full h-10"
            >
              <option value="">Sve</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Pretraži..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded-md w-full h-10"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleRestaurants.length === 0 ? (
          <p className="text-gray-500 col-span-full">
            Nema restorana za odabrane filtere.
          </p>
        ) : (
          visibleRestaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))
        )}
      </div>
      {visibleCount < filteredRestaurants.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            className="bg-[#0F766E] text-white px-6 py-3 rounded hover:bg-[#0E6659]"
          >
            Učitaj više...
          </button>
        </div>
      )}
    </div>
  );
}
