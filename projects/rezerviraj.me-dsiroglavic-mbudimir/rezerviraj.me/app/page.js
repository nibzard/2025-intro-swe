"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import RestaurantCard from "@/app/components/RestaurantCard";

export default function Home() {
  const [city, setCity] = useState("");
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
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const visibleRestaurants = filteredRestaurants.slice(0, visibleCount);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="w-full bg-[#0F766E] text-white rounded-xl mb-10 flex flex-col md:flex-row items-center md:items-start justify-between shadow-lg overflow-hidden">
        <div className="p-8 flex-1 flex flex-col justify-center md:justify-start">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            Dobrodošli u Rezerviraj.me
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-lg">
            Otkrijte najbolje restorane i rezervirajte svoje mjesto na vrijeme!
          </p>
          <button className="bg-white text-[#0F766E] font-semibold px-6 py-3 rounded hover:bg-gray-100 w-40">
            <Link href="/login">Prijava</Link>
          </button>
        </div>

        <div className="flex-1 relative w-full h-64 md:h-96 md:w-1/2">
          <Image
            src="/images/home-image.jpeg"
            alt="Image of a restaurant"
            fill
            quality={100}
            className="object-contain rounded-l-xl"
          />
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border p-2 rounded-md w-full md:w-48"
        >
          <option value="">Odaberi grad</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Pretraži..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-md w-full md:w-64 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleRestaurants.length === 0 ? (
          <p className="text-gray-500 col-span-full">
            Nema restorana koji odgovaraju odabranoj pretrazi
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
