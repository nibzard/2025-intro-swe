let reservations = []; 

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(reservations);
}

export async function POST(req) {
  const data = await req.json();

  const newReservation = {
    id: Date.now(),
    ...data,
  };

  reservations.push(newReservation);

  return NextResponse.json(newReservation);
}
