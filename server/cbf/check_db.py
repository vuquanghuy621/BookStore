import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv('MONGODB_CONNECT_URI')
print(f"Connecting to: {MONGO_URI}")
client = MongoClient(MONGO_URI)
try:
    print("Databases:", client.list_database_names())
except Exception as e:
    print("Error:", e)
finally:
    client.close()
