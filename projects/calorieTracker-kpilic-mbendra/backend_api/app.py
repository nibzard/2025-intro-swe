import os
from flask import Flask, jsonify 
from flask_cors import CORS 

# --- KONFIGURACIJA ---
app = Flask(__name__)
# Omogućavanje CORS-a
CORS(app) 

# Kreiranje foldera za slike (iako ga trenutno ne koristimo)
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ---------------------- 1. Osnovna Testna RUTA ----------------------
@app.route('/api/test', methods=['GET'])
def test_route():
    """Vraća poruku o uspješnom pokretanju backenda."""
    return jsonify({
        'success': True, 
        'message': 'Backend je uspješno pokrenut i CORS radi!'
    }), 200

# ---------------------- 2. Prazne rute za budući rad ----------------------
# Dodat ćemo funkcionalnost ovdje kasnije
@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal_placeholder():
    return jsonify({'success': False, 'error': 'Funkcionalnost pretraživanja nije implementirana.'}), 501

@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal_placeholder():
    return jsonify({'success': False, 'error': 'Funkcionalnost analize slike nije implementirana.'}), 501

if __name__ == '__main__':
    # Pokreće se na portu 5000
    app.run(debug=True, port=5000)