import os
import httpx
import json

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

def list_gemini_models():
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("Please set the environment variable and try again.")
        print("e.g., export GEMINI_API_KEY='YOUR_API_KEY'")
        return

    api_url = f"{GEMINI_API_BASE_URL}/models"
    params = {"key": GEMINI_API_KEY}

    print("--- Fetching available models from Gemini API (v1beta) ---")

    try:
        with httpx.Client() as client:
            response = client.get(api_url, params=params)
            response.raise_for_status()
            
            response_data = response.json()
            print("\n--- Available Models that support 'generateContent' ---")
            
            found_models = False
            for model in response_data.get('models', []):
                model_name = model.get('name')
                supported_methods = model.get('supportedGenerationMethods', [])
                if 'generateContent' in supported_methods:
                    found_models = True
                    print(f"- {model_name}")
            
            if not found_models:
                print("No models found that support 'generateContent'.")

    except httpx.HTTPStatusError as e:
        print(f"\n--- API Request Failed ---")
        print(f"Status Code: {e.response.status_code}")
        try:
            error_details = e.response.json()
            print("Error JSON:")
            print(json.dumps(error_details, indent=2))
        except json.JSONDecodeError:
            print("Could not decode error response as JSON.")
            print("Raw response:")
            print(e.response.text)
            
    except Exception as e:
        print(f"\n--- An unexpected error occurred ---")
        print(e)

if __name__ == "__main__":
    list_gemini_models()