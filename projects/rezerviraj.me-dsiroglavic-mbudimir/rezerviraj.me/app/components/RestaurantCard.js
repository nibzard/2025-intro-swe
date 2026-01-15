import Image from "next/image";

export default function RestaurantCard({ restaurant }) {
  return (
    <div className="border rounded-md overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200">
      <Image
        src={restaurant.image}
        alt={restaurant.name}
        width={400}
        height={250}
        quality={100}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h2 className="text-xl font-bold text-[#0F766E]">{restaurant.name}</h2>
        <p className="text-sm text-gray-700">{restaurant.city}</p>
        <p className="text-sm text-gray-700">Ocjena: {restaurant.rating}</p>
        <p className="text-sm text-gray-700">Broj sjedećih mjesta: {restaurant.seats}</p>
        <p className="text-sm text-gray-700">Cijena: {restaurant.price_range}</p>
      </div>
    </div>
  );
}
