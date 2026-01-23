"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function RezervacijePage() {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    fetch("/api/reservations")
      .then((res) => res.json())
      .then((data) => setReservations(data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold text-[#0F766E] mb-6">
        Moje rezervacije
      </h1>

      {reservations.length === 0 && (
        <p className="text-gray-500">Nema rezervacija.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reservations.map((res) => (
          <div
            key={res.id}
            className="border rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
          >
            <Image
              src={res.restaurantImage}
              alt={res.restaurantName}
              width={400}
              height={200}
              className="w-full h-40 object-cover"
            />

            <div className="p-4">
              <h2 className="text-xl font-bold text-[#0F766E] mb-2">
                {res.restaurantName}
              </h2>
              <p className="text-gray-700">
                <strong>Datum:</strong> {res.date}
              </p>
              <p className="text-gray-700">
                <strong>Vrijeme:</strong> {res.time}
              </p>
              <p className="text-gray-700">
                <strong>Broj mjesta:</strong> {res.seats}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
