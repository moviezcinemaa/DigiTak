import os
from openai import OpenAI

# Ensure environment variables are loaded
from dotenv import load_dotenv
load_dotenv()

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

try:
    models = client.models.list()
    for m in models.data:
        print(m.id)
except Exception as e:
    print("Error:", e)
