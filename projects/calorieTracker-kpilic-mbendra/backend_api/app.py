import os
import json
from dotenv import load_dotenv # Nova linija za učitavanje .env
from flask import Flask, request, jsonify
from flask_cors import CORS # Nova linija za CORS
from openai import OpenAI

# Učitavanje varijabli iz .env datoteke
load_dotenv() 

# ===================================================
# INICIJALIZACIJA (KLJUČ IZ .ENV)
# ===================================================
app = Flask(__name__)

# Konfiguracija CORS-a: Omogućuje komunikaciju s frontendom na portu 8080
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8080"}})

# Inicijalizacija OpenAI klijenta s ključem iz .env datoteke
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY nije pronađen u .env datoteci")

client = OpenAI(api_key=openai_api_key)

# ===================================================
# SIMULACIJA BAZE PODATAKA ZA PRETRAŽIVANJE (lookup_meal)
# ===================================================
MEAL_DB = {
    "piletina": {"calories_per_100g": 165, "protein": 31, "fat": 3.6, "carbs": 0},
    "riza": {"calories_per_100g": 130, "protein": 2.7, "fat": 0.3, "carbs": 28},
    "pizza": {"calories_per_100g": 266, "protein": 11, "fat": 10, "carbs": 33},
    "jaja": {"calories_per_100g": 155, "protein": 13, "fat": 11, "carbs": 1.1},
    "brokula": {"calories_per_100g": 34, "protein": 2.8, "fat": 0.4, "carbs": 6.6},
}

# ===================================================
# FUNKCIJE RUTA
# ===================================================

@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal():
    """Ruta za analizu slike pomoću OpenAI Vision API-ja."""
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "Nije priložena slika"}), 400

    image_file = request.files['image']
    
    try:
        # Preuzimanje podataka iz datoteke i konvertiranje u base64
        import base64
        encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
        image_mime = image_file.mimetype or 'image/jpeg' # Pretpostavljamo jpeg ako nema mime tipa

        # Kreiranje poruke za Vision model
        prompt = (
            "Detaljno analiziraj ovu sliku obroka. Identificiraj glavne namirnice, procijeni njihovu težinu "
            "i zatim procjeni ukupan broj kalorija (kcal), proteina (g), masti (g) i ugljikohidrata (g) za cijeli obrok. "
            "Odgovor MORA biti striktno u JSON formatu i MORA sadržavati polja: 'name' (kratki opis obroka), 'calories', 'protein', 'fat' i 'carbs'."
            "Koristi razumne procjene. Pazi na format. Primjer: {'name': 'Jaja i tost', 'calories': 350.5, 'protein': 25.1, 'fat': 15.0, 'carbs': 30.2}"
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{image_mime};base64,{encoded_image}"}}
                    ],
                }
            ],
            max_tokens=300,
            response_format={"type": "json_object"} # Nalažemo JSON izlaz
        )

        # Parsiranje JSON odgovora
        json_string = response.choices[0].message.content
        meal_data = json.loads(json_string)

        # Provjera i vraćanje podataka
        required_keys = ['name', 'calories', 'protein', 'fat', 'carbs']
        if all(k in meal_data for k in required_keys):
            return jsonify({
                "success": True,
                "name": meal_data['name'],
                "calories": float(meal_data['calories']),
                "protein": float(meal_data['protein']),
                "fat": float(meal_data['fat']),
                "carbs": float(meal_data['carbs'])
            })
        else:
            return jsonify({"success": False, "error": "AI nije vratio ispravan JSON format."}), 500

    except Exception as e:
        print(f"Greška u AI analizi: {e}")
        return jsonify({"success": False, "error": f"Interna serverska greška: {str(e)}"}), 500


@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    """Ruta za pretraživanje simulirane baze podataka."""
    data = request.json
    meal_name = data.get('meal_name', '').lower()
    grams = data.get('grams', 100)

    if meal_name in MEAL_DB:
        base_data = MEAL_DB[meal_name]
        factor = grams / 100.0

        result = {
            "success": True,
            "name": f"{meal_name.capitalize()} ({grams}g)",
            "calories": base_data['calories_per_100g'] * factor,
            "protein": base_data['protein'] * factor,
            "fat": base_data['fat'] * factor,
            "carbs": base_data['carbs'] * factor
        }
        return jsonify(result)
    else:
        return jsonify({"success": False, "error": "Namirnica nije pronađena."}), 404

# ===================================================
# POKRETANJE APLIKACIJE
# ===================================================

if __name__ == '__main__':
    # Flask će se pokrenuti na http://localhost:5000/
    print("Flask aplikacija se pokreće na http://localhost:5000/")
    app.run(debug=True, port=5000)