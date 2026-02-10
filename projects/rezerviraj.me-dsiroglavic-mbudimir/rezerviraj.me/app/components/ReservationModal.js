"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/app/lib/supabaseClient";

export default function ReservationModal({ restaurant, onClose }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getAvailableHours = () => {
    if (!date) return [];

    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
    });

    const hoursRange = restaurant.opening_hours[dayOfWeek];
    if (!hoursRange) return [];

    const [open, close] = hoursRange.split("-");
    const [openH, openM] = open.split(":").map(Number);
    const [closeH, closeM] = close.split(":").map(Number);

    const hours = [];
    let currentH = openH;
    let currentM = openM;

    while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
      const hh = currentH.toString().padStart(2, "0");
      const mm = currentM.toString().padStart(2, "0");
      hours.push(`${hh}:${mm}`);

      currentM++;
      if (currentM >= 60) {
        currentM = 0;
        currentH++;
      }
    }

    return hours;
  };

  const availableHours = getAvailableHours();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      alert("Moraš biti prijavljen da bi napravio rezervaciju.");
      return;
    }

    const { error } = await supabase.from("reservations").insert([
      {
        user_id: user.id,
        restaurant_name: restaurant.name,
        restaurant_image: restaurant.image,
        date,
        time,
        seats: Number(seats),
      },
    ]);

    if (error) {
      console.error(error);
      alert("Greška kod spremanja rezervacije.");
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>

        <Image
          src={restaurant.image}
          alt={restaurant.name}
          width={500}
          height={300}
          className="w-full h-40 object-cover rounded-md"
        />

        <h2 className="text-2xl font-bold text-[#0F766E] mt-4">
          {restaurant.name}
        </h2>

        {!user && (
          <p className="text-sm text-red-600 mt-2">
            Moraš biti prijavljen za rezervaciju.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium">Datum</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getMinDate()}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Vrijeme</label>
            <select
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border rounded-md p-2"
              disabled={availableHours.length === 0}
            >
              <option value="">Odaberi vrijeme</option>
              {availableHours.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            {availableHours.length > 0 && (
              <p className="text-xs text-gray-500">
                Radno vrijeme: {availableHours[0]} –{" "}
                {availableHours[availableHours.length - 1]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">
              Broj sjedećih mjesta
            </label>
            <input
              type="number"
              min="1"
              max={restaurant.seats}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full border rounded-md p-2"
            />
          </div>

          <button
            type="submit"
            disabled={!user}
            className="w-full bg-[#0F766E] text-white py-2 rounded-md hover:bg-[#115e59] disabled:opacity-50"
          >
            {user ? "Rezerviraj" : "Prijavi se za rezervaciju"}
          </button>
        </form>
      </div>
    </div>
  );
}
