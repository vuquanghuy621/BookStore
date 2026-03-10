import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from data_provider import get_books_df, get_user_interactions
from bson import ObjectId


# Global storage for the model
recommender_context = {
    'df': None,
    'cosine_sim': None
}

def get_recommender_model():
    """Singleton accessor for the recommender model"""
    if recommender_context['df'] is None or recommender_context['cosine_sim'] is None:
        print("Loading Recommender Model...")
        df, cosine_sim = build_recommender()
        recommender_context['df'] = df
        recommender_context['cosine_sim'] = cosine_sim
        print("Recommender Model Loaded.")
    return recommender_context['df'], recommender_context['cosine_sim']

def build_recommender():
    df = get_books_df()
    # Handle empty database case
    if df.empty:
        return df, None
        
    tfidf = TfidfVectorizer(stop_words='english')
    # Fill NaN with empty string to avoid errors
    df['combined_features'] = df['combined_features'].fillna('')
    tfidf_matrix = tfidf.fit_transform(df['combined_features'])
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    return df, cosine_sim

def recommend_books(user_id_str, top_n=36):
    df, cosine_sim = get_recommender_model()
    
    if df is None or df.empty:
        return []

    try:
        user_id = ObjectId(user_id_str)
        interactions = get_user_interactions(user_id)
    except Exception as e:
        print(f"Error fetching interactions: {e}")
        # Invalid ID or guest user, return most recent books
        return df.sort_index(ascending=False).head(top_n)['_id'].tolist()

    # Combine all interacted books
    interacted_ids = set(interactions['views'] + interactions['favorites'] + interactions['reviews'])
    
    if not interacted_ids:
        # If no history, return most recent books
        return df.sort_index(ascending=False).head(top_n)['_id'].tolist()

    # Calculate scores based on similarity to interacted books
    # We can weight Favorites and Reviews higher than Views
    weights = {
        'views': 1,
        'favorites': 3,
        'reviews': 2
    }
    
    sim_scores = pd.Series(0, index=df.index)
    
    # Helper to process interactions safely
    def process_interactions(interaction_list, weight):
        if not interaction_list:
            return
            
        for book_id in interaction_list:
            # Find the index of the book in the dataframe
            idx_list = df.index[df['_id'] == book_id].tolist()
            if idx_list:
                # Add weighted similarity scores
                idx = idx_list[0]
                if cosine_sim is not None:
                    sim_scores.add(cosine_sim[idx] * weight, fill_value=0)

    try:
        if cosine_sim is not None:
            # Note: sim_scores is modified in place or by assignment? 
            # pd.Series operations return new series usually, but let's be explicit
            
            # Since we need to accumulate, let's just iterate.
            # But the previous logic was valid `sim_scores += ...` works for Series.
            
            # Re-implementing the loops but ensuring safety
            for book_id in interactions['views']:
                idx_list = df.index[df['_id'] == book_id].tolist()
                if idx_list:
                    sim_scores += cosine_sim[idx_list[0]] * weights['views']
                    
            for book_id in interactions['favorites']:
                idx_list = df.index[df['_id'] == book_id].tolist()
                if idx_list:
                    sim_scores += cosine_sim[idx_list[0]] * weights['favorites']
                    
            for book_id in interactions['reviews']:
                idx_list = df.index[df['_id'] == book_id].tolist()
                if idx_list:
                    sim_scores += cosine_sim[idx_list[0]] * weights['reviews']
    except Exception as e:
        print(f"Error checking similarity: {e}")
        return df.sort_index(ascending=False).head(top_n)['_id'].tolist()

    # Sort and get top N
    sim_scores = sim_scores.sort_values(ascending=False)
    
    # Filter out already interacted books? (Optional, usually we want to recommend new things)
    recommended_indices = []
    for idx, score in sim_scores.items():
        # idx is the index in the dataframe
        book_id = df.iloc[idx]['_id']
        if book_id not in interacted_ids:
            recommended_indices.append(idx)
        if len(recommended_indices) >= top_n:
            break
            
    return df.iloc[recommended_indices]['_id'].tolist()
