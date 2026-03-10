import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGODB_CONNECT_URI')
client = MongoClient(MONGO_URI)
db = client.get_database('test') # It will use the default db from URI or you can specify db = client['your_db_name']

def get_books_df():
    books = list(db.books.find({}, {
        '_id': 1, 'name': 1, 'genre': 1, 'author': 1, 'publisher': 1
    }))
    
    # Create lookup dictionaries for faster access
    print("Fetching auxiliary data...")
    all_genres = {g['_id']: g['name'] for g in db.genres.find({}, {'_id': 1, 'name': 1})}
    all_authors = {a['_id']: a['name'] for a in db.authors.find({}, {'_id': 1, 'name': 1})}
    # Publisher might be just an ID in book, so map ID -> Name
    all_publishers = {p['_id']: p['name'] for p in db.publishers.find({}, {'_id': 1, 'name': 1})}
    
    # Expand Genre, Author, Publisher names
    print(f"Processing {len(books)} books...")
    for book in books:
        # Get Genre names
        genre_ids = book.get('genre', [])
        # Ensure list compatibility
        if not isinstance(genre_ids, list):
            genre_ids = [genre_ids]
        book['genre_names'] = ' '.join([all_genres.get(g_id, '') for g_id in genre_ids if g_id in all_genres])
        
        # Get Author names
        author_ids = book.get('author', [])
        if not isinstance(author_ids, list):
            author_ids = [author_ids]
        book['author_names'] = ' '.join([all_authors.get(a_id, '') for a_id in author_ids if a_id in all_authors])
        
        # Get Publisher name
        publisher_id = book.get('publisher')
        book['publisher_name'] = all_publishers.get(publisher_id, '')
        
    df = pd.DataFrame(books)
    df['_id'] = df['_id'].astype(str)
    # Combine features into a single string for TF-IDF
    df['combined_features'] = df['genre_names'] + ' ' + df['author_names'] + ' ' + df['publisher_name']
    return df

def get_user_interactions(user_id):
    user = db.users.find_one({'_id': user_id})
    if not user:
        return {'views': [], 'favorites': [], 'reviews': []}
    
    # Viewed books
    viewed = [str(item['book']) for item in user.get('viewed_books', [])] # Note: check if field is viewedBooks or viewed_books
    # Actually I added viewedBooks in the model earlier
    viewed = [str(item['book']) for item in user.get('viewedBooks', [])]
    
    # Favorites
    favorites = [str(item) for item in user.get('favorites', [])]
    
    # Reviews (Purchased/Reviewed)
    reviews = list(db.reviews.find({'user': user_id}))
    reviewed_books = [str(r['book']) for r in reviews]
    
    return {
        'views': viewed,
        'favorites': favorites,
        'reviews': reviewed_books
    }
