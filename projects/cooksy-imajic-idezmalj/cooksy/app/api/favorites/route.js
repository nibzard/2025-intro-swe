import { supabase } from "@/app/lib/supabaseClient";

export async function GET(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return new Response(JSON.stringify([]));

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response(JSON.stringify([]));

  const { data: favorites } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id);

  return new Response(JSON.stringify(favorites));
}

export async function POST(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return new Response(JSON.stringify({ success: false }), { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response(JSON.stringify({ success: false }), { status: 401 });

  const recipe = await request.json();
  const { data: exists } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .eq("recipe_id", recipe.id)
    .single();

  if (!exists) {
    await supabase.from("favorites").insert({
      user_id: user.id,
      recipe_id: recipe.id,
      recipe: recipe,
    });
  }

  return new Response(JSON.stringify({ success: true }));
}

export async function DELETE(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return new Response(JSON.stringify({ success: false }), { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response(JSON.stringify({ success: false }), { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ success: false, message: "No id" }), { status: 400 });

  await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("recipe_id", id);

  return new Response(JSON.stringify({ success: true }));
}
