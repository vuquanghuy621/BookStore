from flask import Flask, jsonify, request
from flask_cors import CORS
from recommender import recommend_books, get_recommender_model
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/recommend/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    try:
        limit = int(request.args.get('limit', 36))
        recommendations = recommend_books(user_id, top_n=limit)
        return jsonify({
            'status': 'success',
            'data': recommendations
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Preload the model
    print("Preloading AI model...")
    get_recommender_model()
    
    port = int(os.environ.get('AI_PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=True)
