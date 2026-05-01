from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import joblib
import pandas as pd
import os
import shutil
import tempfile
import traceback as tb
from typing import List, Optional

import speech_recognition as sr
from pydub import AudioSegment
from pydub.silence import detect_nonsilent

import models, database
print("🔥 Starting app...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 

print("BASE DIR:", BASE_DIR)
print("FILES IN MODELS:", os.listdir(os.path.join(BASE_DIR, "models")))

# ---- Animal list for Task 2 ----
ANIMAL_LIST = {
    "cat", "dog", "lion", "tiger", "elephant", "horse", "cow", "goat", "sheep",
    "pig", "rabbit", "deer", "bear", "wolf", "fox", "monkey", "gorilla", "chimpanzee",
    "zebra", "giraffe", "hippo", "rhino", "crocodile", "alligator", "snake", "lizard",
    "frog", "toad", "turtle", "tortoise", "eagle", "parrot", "pigeon", "crow", "hen",
    "duck", "goose", "peacock", "flamingo", "penguin", "dolphin", "whale", "shark",
    "fish", "octopus", "crab", "shrimp", "ant", "bee", "butterfly", "spider",
    "mosquito", "fly", "cockroach", "rat", "mouse", "squirrel", "bat", "camel",
    "donkey", "mule", "bison", "buffalo", "kangaroo", "koala", "panda", "cheetah",
    "leopard", "jaguar", "hyena", "jackal", "meerkat", "mongoose", "otter", "seal",
    "walrus", "polar bear", "grizzly", "owl", "sparrow", "robin", "hawk", "falcon",
    "vulture", "ostrich", "emu", "kiwi", "lobster", "jellyfish", "starfish", "seahorse",
    "salmon", "tuna", "catfish", "parrotfish", "clam", "snail", "worm", "leech",
    # Hindi/Marathi animal names transliterated
    "billie", "kutta", "sher", "haathi", "ghoda", "gaay", "bakri", "bhed","saanp",
    "mendak", "machhli", "murgha", "bandar", "hiran", "bagh", "lomdi",
}

# Authentication Config
SECRET_KEY = "your-secret-key-for-semester-project" # In production, use an environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(title="Dementia Screening API", description="Predicts cognitive risk levels from screening test features.")

# Allow CORS for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=database.engine)

# Load machine learning model and scaler
# MODEL_PATH = "../ml_model/modelssg/model.pkl"
# SCALER_PATH = "../ml_model/models/scaler.pkl"

# if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
#     model = joblib.load(MODEL_PATH)
#     scaler = joblib.load(SCALER_PATH)
# else:
#     model = None
#     scaler = None
#     print("Warning: Model or scaler not found.")

MODEL_PATH = os.path.join(BASE_DIR, "models", "model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")

print("MODEL PATH:", MODEL_PATH)
print("SCALER PATH:", SCALER_PATH)

if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("✅ Model loaded successfully")
else:
    model = None
    scaler = None
    print("Warning: Model or scaler not found.")

# --- Models ---
class UserCreate(BaseModel):
    username: str
    password: str
    age: int

class UserOut(BaseModel):
    username: str
    age: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PredictionFeatures(BaseModel):
    memory_accuracy: float
    reaction_time: float
    attention_accuracy: float
    speech_rate: float
    pause_duration: float
    pitch_variance: float
    task_completion_time: float
    age: int

class PredictionResponse(BaseModel):
    predicted_risk_level: str
    recommendation_message: str

class ScreeningResultOut(BaseModel):
    memory_accuracy: float
    reaction_time: float
    attention_accuracy: float
    speech_rate: float
    risk_level: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Auth Helpers ---
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- Voice Analysis Helpers ---

def convert_to_wav(input_path: str, output_path: str):
    """Convert any audio format to wav using pydub+ffmpeg."""
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio.export(output_path, format="wav")
    return audio

def transcribe_wav(wav_path: str, language: str = 'en-US') -> str:
    """Transcribe a wav file using Google Web Speech API."""
    recognizer = sr.Recognizer()
    with sr.AudioFile(wav_path) as source:
        audio_data = recognizer.record(source)
    try:
        return recognizer.recognize_google(audio_data, language=language).lower()
    except sr.UnknownValueError:
        print(f"Speech Recognition could not understand audio in {language}")
        return ""
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")
        return ""

def get_pause_metrics(wav_path: str) -> dict:
    """Measure silence/speaking patterns from a wav file."""
    audio = AudioSegment.from_wav(wav_path)
    duration_ms = len(audio)
    nonsilent_chunks = detect_nonsilent(audio, min_silence_len=400, silence_thresh=-40)
    speaking_ms = sum(end - start for start, end in nonsilent_chunks)
    silence_ms = duration_ms - speaking_ms
    pause_ratio = silence_ms / duration_ms if duration_ms > 0 else 0
    num_pauses = max(0, len(nonsilent_chunks) - 1)
    # Pause duration in seconds (avg gap)
    avg_pause_s = (silence_ms / 1000) / max(num_pauses, 1)
    # Speech rate proxy: words per minute = speaking_ms / total_ms * 160 (avg wpm)
    speech_rate = (speaking_ms / duration_ms) * 160 if duration_ms > 0 else 0
    return {
        "pause_ratio": pause_ratio,
        "pause_duration": round(avg_pause_s, 2),
        "speech_rate": round(speech_rate, 1),
        "speaking_ms": speaking_ms,
        "silence_ms": silence_ms,
    }

# --- Voice Analysis Endpoint ---

@app.post("/analyze-voice/{task_id}")
async def analyze_voice(task_id: int, file: UploadFile = File(...), lang: str = Form("en")):
    """
    task_id 1 = Repeat 3 Words
    task_id 2 = Animal Naming
    task_id 3 = Daily Recall
    """
    try:
        # Save uploaded file to a temp directory
        with tempfile.TemporaryDirectory() as tmpdir:
            raw_path = os.path.join(tmpdir, "recording" + os.path.splitext(file.filename or ".m4a")[1])
            wav_path = os.path.join(tmpdir, "recording.wav")

            with open(raw_path, "wb") as f:
                shutil.copyfileobj(file.file, f)

            # Convert to wav
            audio = convert_to_wav(raw_path, wav_path)
            duration_s = len(audio) / 1000

            # Get acoustic metrics
            metrics = get_pause_metrics(wav_path)

            # Map lang to Google Speech API code
            lang_code = "en-US"
            if lang == "hi":
                lang_code = "hi-IN"
            elif lang == "mr":
                lang_code = "mr-IN"

            if task_id == 1:
                # --- Task 1: Repeat 3 words (Mango, River, Temple) ---
                text = transcribe_wav(wav_path, language=lang_code)
                print(f"Task 1 Transcription ({lang_code}): {text}")
                target_words = {"mango", "river", "temple", "aam", "nadi", "mandir"}
                words_spoken = set(text.split())
                matched = words_spoken & target_words
                memory_accuracy = (len(matched) / 3) * 100
                return {
                    "task": 1,
                    "transcription": text,
                    "memory_accuracy": round(memory_accuracy, 1),
                    "pause_duration": metrics["pause_duration"],
                    "speech_rate": metrics["speech_rate"],
                    "pitch_variance": 42.0,  # Still estimated - needs librosa
                    "task_completion_time": round(duration_s, 1),
                }

            elif task_id == 2:
                # --- Task 2: Animal Naming (30s) ---
                text = transcribe_wav(wav_path, language=lang_code)
                print(f"Task 2 Transcription ({lang_code}): {text}")
                words = set(text.split())
                matched_animals = words & ANIMAL_LIST
                fluency_score = len(matched_animals)
                # Map score to speech_rate adjustment
                base_rate = 145.0
                if fluency_score >= 8:
                    adj_rate = base_rate
                elif fluency_score >= 5:
                    adj_rate = base_rate - 20
                else:
                    # Significant drop for < 5 animals (high risk threshold is around 70-100)
                    adj_rate = base_rate - 75 
                return {
                    "task": 2,
                    "transcription": text,
                    "fluency_score": fluency_score,
                    "animals_named": list(matched_animals),
                    "speech_rate": adj_rate,
                    "task_completion_time": round(duration_s, 1),
                }

            elif task_id == 3:
                # --- Task 3: Daily Recall (45s) ---
                text = transcribe_wav(wav_path, language=lang_code)
                print(f"Task 3 Transcription ({lang_code}): {text}")
                word_count = len(text.split())
                pause_ratio = metrics["pause_ratio"]

                if pause_ratio < 0.35 and word_count >= 20:
                    clarity = "Clear"
                    memory_adj = 0
                    pause_adj = 0
                elif pause_ratio < 0.6 or word_count >= 10:
                    clarity = "Moderate"
                    memory_adj = -10
                    pause_adj = 0.2
                else:
                    clarity = "Vague"
                    memory_adj = -25
                    pause_adj = 0.5

                return {
                    "task": 3,
                    "transcription": text,
                    "word_count": word_count,
                    "clarity": clarity,
                    "memory_accuracy_adj": memory_adj,
                    "pause_duration_adj": pause_adj,
                    "task_completion_time": round(duration_s, 1),
                }

            else:
                raise HTTPException(status_code=400, detail="Invalid task_id")

    except Exception as e:
        print(f"ERROR in /analyze-voice/{task_id}: {e}")
        print(tb.format_exc())
        raise HTTPException(status_code=500, detail=f"Audio analysis error: {str(e)}")

# --- Endpoints ---

@app.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password, age=user.age)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/predict", response_model=PredictionResponse)
def predict_risk(
    
    
    features: PredictionFeatures, 
    current_user: Optional[models.User] = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
   
):

    print("🔥 /predict API called")
    print("🧪 CURRENT USER:", current_user)
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="ML Model not loaded.")

    try:
        df_features = pd.DataFrame([features.dict()])
        scaled_features = scaler.transform(df_features)
        prediction = model.predict(scaled_features)[0]

        recommendation = "Normal"
        if prediction == "Moderate Risk":
            recommendation = "Minor challenges detected. Monitor results."
        elif prediction == "High Risk":
            recommendation = "Possible cognitive difficulty. Seek medical screening."
        else:
            recommendation = "Responses appear normal."

        # SAVE TO DATABASE if user is logged in
        if current_user:
            db_result = models.ScreeningResult(
                user_id=current_user.id,
                **features.dict(),
                risk_level=prediction
            )
            db.add(db_result)
            db.commit()
            print("✅ Data saved to database")
        else:
         print("❌ No user found → NOT saving data")

        return PredictionResponse(
            predicted_risk_level=prediction,
            recommendation_message=recommendation
        )
    except Exception as e:
        import traceback
        print(f"ERROR IN /predict: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/history", response_model=List[ScreeningResultOut])
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    return current_user.results

@app.get("/")
def read_root():
    return {"message": "Dementia Screening API with Patient Storage is running."}
