"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RezervacijePage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadReservations = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setReservations(data || []);
      }

      setLoading(false);
    };

    loadReservations();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-4 text-center">
        <p className="text-gray-500 text-lg">Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      {!user && (
        <div className="flex flex-col items-center justify-center mt-32 text-center">
          <p className="text-xl text-gray-600 mb-6">
            Za pregled i dodavanje rezervacija potrebna je prijava.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="bg-[#0F766E] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#115e59]"
          >
            Prijava
          </button>
        </div>
      )}

      {user && reservations.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-32">
          <p className="text-gray-500 text-xl">Nema rezervacija.</p>
        </div>
      )}

      {user && reservations.length > 0 && (
        <>
          <h1 className="text-3xl font-bold text-[#0F766E] mb-6">
            Moje rezervacije
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="border rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                <Image
                  src={res.restaurant_image}
                  alt={res.restaurant_name}
                  width={400}
                  height={200}
                  className="w-full h-40 object-cover"
                />

                <div className="p-4">
                  <h2 className="text-xl font-bold text-[#0F766E] mb-2">
                    {res.restaurant_name}
                  </h2>

                  <p className="text-gray-700 text-lg">
                    <strong>Datum:</strong> {res.date}
                  </p>
                  <p className="text-gray-700 text-lg">
                    <strong>Vrijeme:</strong> {res.time}
                  </p>
                  <p className="text-gray-700 text-lg">
                    <strong>Broj mjesta:</strong> {res.seats}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
