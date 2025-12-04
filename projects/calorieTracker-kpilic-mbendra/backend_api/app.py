from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app) 

# -------------------- KONFIGURACIJA --------------------
# Kreiranje foldera za slike (iako je isključen, neka ostane)
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- FUNKCIJA: DOHVAT PODATAKA (SIMULACIJA ZA PRETRAŽIVANJE) ---
def _get_simulated_data(query_term):
    # Simulirani podaci (SVE VRIJEDNOSTI SU ZA 100g)
    db = {
        "piletina": {"name": "Pileća prsa", "calories": 165, "protein": 31.0, "fat": 3.6, "carbs": 0.0},
        "riza": {"name": "Kuhana riža", "calories": 130, "protein": 2.7, "fat": 0.3, "carbs": 28.2},
        "jabuka": {"name": "Jabuka", "calories": 52, "protein": 0.3, "fat": 0.2, "carbs": 13.8},
        "losos": {"name": "Filet lososa", "calories": 208, "protein": 20.4, "fat": 13.4, "carbs": 0.0}
    }
    
    normalized_query = query_term.lower()
    for key, value in db.items():
        if normalized_query in key or key in normalized_query:
            return value
    return None

# --- RUTE API-ja (FOKUS NA RUČNI UNOS) ---

# ---------------------- 1. RUTA: Analiza Slike (ISKLJUČENA) ----------------------
@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal():
    return jsonify({'success': False, 'error': 'Analiza slike je isključena.'}), 400

# ---------------------- 2. RUTA: Barkod (ISKLJUČENA) ----------------------
@app.route('/api/lookup_barcode', methods=['POST'])
def lookup_barcode():
    return jsonify({'success': False, 'error': 'Barkod funkcionalnost je isključena.'}), 400

# ---------------------- 3. RUTA: Ručni unos / Pretraživanje Naziva (OSTAJE AKTIVNO) ----------------------
@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    if not request.json: 
        return jsonify({'success': False, 'error': 'Nema poslanih podataka.'}), 400

    data = request.json
    meal_name = data.get('meal_name', '')
    
    try:
        grams = float(data.get('grams', 100)) 
    except (ValueError, TypeError):
        grams = 100.0 
    
    if not meal_name:
        return jsonify({'success': False, 'error': 'Naziv obroka je obavezan.'}), 400

    meal_data = _get_simulated_data(meal_name) 
    
    if meal_data:
        # PRERAČUNAVANJE GRAMAŽE
        if grams > 0:
            factor = grams / 100.0
        else:
            factor = 0.0 
        
        # Skaliranje svih vrijednosti
        meal_data['name'] = f"{meal_data['name']} ({grams:.0f}g)"
        meal_data['calories'] = round(meal_data['calories'] * factor, 0)
        meal_data['protein'] = round(meal_data['protein'] * factor, 1)
        meal_data['fat'] = round(meal_data['fat'] * factor, 1)
        meal_data['carbs'] = round(meal_data['carbs'] * factor, 1)
        
        return jsonify({'success': True, **meal_data})
    else:
        return jsonify({'success': False, 'error': f'Kalorije za "{meal_name}" nisu pronađene (Pokušajte ručni unos broja)'}), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)