let favorites = [];

export async function GET() {
  return Response.json(favorites);
}

export async function POST(request) {
  const recipe = await request.json();
  const exists = favorites.some(r => r.id === recipe.id);
  if (!exists) {
    favorites.push(recipe);
  }

  return Response.json({ success: true, favorites });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "No id provided" }, { status: 400 });
  }

  favorites = favorites.filter(r => String(r.id) !== String(id));

  return Response.json({ success: true, favorites });
}
