from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from mtranslate import translate
from langdetect import detect
from duckduckgo_search import DDGS
import re

# === Nettoyage texte ===
def clean_response(text):
    text = re.sub(r'<[^>]+>', '', text)
    text = re.split(r'</(Bot|name|opinion|User|[a-zA-Z]*)>', text)[0]
    text = re.sub(r'^\s*[,.:;-]*', '', text)
    text = re.sub(r'^\s*(Psyche|Therapist|Bot|Assistant|AI):?\s*', '', text)
    text = re.sub(r'\([^)]*\)', '', text)
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'[:;=8][-~]?[)D(\\/*|]', '', text)
    text = re.sub(r'\s{2,}', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return " ".join(sentences[:2]).strip()

# === Charger modèles ===
MODEL_PATH = "fatmata/gpt-psybot"
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, use_fast=False)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)

BERT_MODEL_NAME = "fatmata/bert_model"
bert_tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL_NAME)
bert_model = AutoModelForSequenceClassification.from_pretrained(BERT_MODEL_NAME)

CLASSIFIER_PATH = "fatmata/mini_bert"
model_c = AutoModelForSequenceClassification.from_pretrained(CLASSIFIER_PATH)
tokenizer_c = AutoTokenizer.from_pretrained(CLASSIFIER_PATH)

# === Analyse émotion ===
analyzer = SentimentIntensityAnalyzer()
GOEMOTIONS_LABELS = ["admiration","anger","approval","autre","curiosity",
                     "disapproval","gratitude","joy","love","neutral","sadness"]
UNACCEPTABLE_EMOTIONS = {"anger"}

def detect_language(text):
    try:
        detected_lang = detect(text)
        return detected_lang if detected_lang in ["fr", "en", "ar"] else "en"
    except:
        return "en"

def search_duckduckgo(query, max_results=3):
    try:
        search_results = list(DDGS().text(query, max_results=max_results))
        return [result["body"] for result in search_results if "body" in result] or ["Pas trouvé."]
    except Exception as e:
        return [f"Erreur recherche : {str(e)}"]

def generate_response(user_input):
    prompt = f"User: {user_input}\nBot:"
    inputs = tokenizer(prompt, return_tensors="pt")
    output = model.generate(
        input_ids=inputs["input_ids"],
        max_new_tokens=150,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
        do_sample=True,
        temperature=0.7,
        top_k=50,
        top_p=0.9,
        repetition_penalty=1.2
    )
    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    return clean_response(generated_text.split("Bot:")[-1].strip())

def classify_emotion(text):
    sentiment_scores = analyzer.polarity_scores(text)
    compound = sentiment_scores['compound'] * 100
    inputs = bert_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=256)
    with torch.no_grad():
        logits = bert_model(**inputs).logits
    probs = F.softmax(logits, dim=-1).squeeze().cpu().numpy()
    top_emotion_index = probs.argmax()
    top_emotion = GOEMOTIONS_LABELS[top_emotion_index]
    return compound, top_emotion in UNACCEPTABLE_EMOTIONS, top_emotion

def predict(text):
    inputs = tokenizer_c(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model_c(**inputs)
    logits = outputs.logits
    return "recherche" if torch.argmax(logits, dim=-1).item() == 1 else "GPT"

def classify_and_respond(text):
    original_lang = detect_language(text)
    text_en = translate(text, "en")

    category = predict(text_en)
    if category == "recherche":
        response = search_duckduckgo(text_en)
        return "\n".join([translate(r, original_lang) for r in response])

    compound, is_unacceptable, emotion = classify_emotion(text_en)
    if is_unacceptable and abs(compound) > 50:
        return translate("Je ressens beaucoup de tension dans votre message.", original_lang)

    gpt_response = generate_response(text_en)
    return translate(gpt_response, original_lang)

# === API FastAPI ===
app = FastAPI()

class ChatRequest(BaseModel):
    text: str

@app.post("/chat/")
def chat(req: ChatRequest):
    response = classify_and_respond(req.text)
    return {"response": response}
