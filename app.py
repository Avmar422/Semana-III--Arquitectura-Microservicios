import os, traceback, io, mimetypes
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from PIL import Image

load_dotenv()
app = Flask(__name__)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MAX_FILE_SIZE = 10 * 1024 * 1024
MODEL_NAME = "gemini-flash-latest"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        mensaje = request.form.get('mensaje', '')
        archivo = request.files.get('file')
        
        contents = []
        if mensaje:
            contents.append(mensaje)
        
        meta = None
        if archivo:
            archivo.seek(0, os.SEEK_END)
            size = archivo.tell()
            archivo.seek(0)
            
            if size > MAX_FILE_SIZE:
                return jsonify({"respuesta": "El archivo excede los 10MB."}), 400

            blob = archivo.read()
            mime_tipo, _ = mimetypes.guess_type(archivo.filename)
            mime_tipo = mime_tipo or archivo.content_type or 'application/octet-stream'

            meta = {
                "nombre": archivo.filename, 
                "tipo": mime_tipo, 
                "tamano": f"{size/1024:.2f} KB"
            }
            
            if "image" in mime_tipo:
                img = Image.open(io.BytesIO(blob))
                contents.append(img)
            else:
                contents.append({"mime_type": mime_tipo, "data": blob})

        if not contents:
            contents = ["Analiza esto"]

        token_count_in = client.models.count_tokens(
            model=MODEL_NAME,
            contents=contents
        ).total_tokens

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config={'max_output_tokens': 3000}
        )

        token_count_out = client.models.count_tokens(
            model=MODEL_NAME,
            contents=[response.text]
        ).total_tokens

        return jsonify({
            "respuesta": response.text,
            "tokens": {
                "in": token_count_in,
                "out": token_count_out
            },
            "file_info": meta
        })
    except Exception:
        return jsonify({"respuesta": "Error", "error": traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(debug=True)
