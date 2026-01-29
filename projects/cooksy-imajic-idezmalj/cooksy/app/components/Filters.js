"use client"

export default function Filters({ ratingFilter, setRatingFilter, prepTimeFilter, setPrepTimeFilter }) {
  return (
    <div className="hidden md:flex justify-between items-center mb-5 mx-7 mt-5">
      <select
        value={ratingFilter}
        onChange={(e) => setRatingFilter(e.target.value)}
        className="px-4 py-2 rounded border border-black bg-white text-black"
      >
        <option value="All">All ratings</option>
        <option value="5">5 stars</option>
        <option value="4">4 stars & up</option>
        <option value="3">3 stars & up</option>
        <option value="2">2 stars & up</option>
      </select>
      <select
        value={prepTimeFilter}
        onChange={(e) => setPrepTimeFilter(e.target.value)}
        className="px-4 py-2 rounded border border-black bg-white text-black"
      >
        <option value="All">Prep times</option>
        <option value="15">Up to 15 min</option>
        <option value="30">Up to 30 min</option>
        <option value="60">Up to 60 min</option>
      </select>

    </div>
  )
}
