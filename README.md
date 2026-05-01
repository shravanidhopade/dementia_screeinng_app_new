# Multilingual Voice-Based Early Dementia Screening Mobile App

This project is a complete semester project featuring:
1. Multilingual React Native Mobile App (Expo) designed for elderly, low-literacy users.
2. Machine Learning Pipeline (Dataset Generation & Random Forest Model).
3. FastAPI Backend for predicting cognitive risk based on app outputs.

## Project Structure
- `mobile_app/`: React Native (Expo) source code.
- `ml_model/`: Scripts to generate a synthetic dataset and train the Random Forest model.
- `backend_api/`: FastAPI server to serve the trained model.

## Setup & Running Instructions

### 1. Machine Learning & Dataset
Navigate to the `ml_model` directory:
```bash
cd ml_model
pip install -r requirements.txt
python generate_dataset.py
python train_model.py
```
This will generate `synthetic_dementia_data.csv` and train `model.pkl`.

### 2. Backend API
Navigate to the `backend_api` directory:
```bash
cd backend_api
pip install -r requirements.txt
# Copy the model
cp ../ml_model/models/model.pkl .
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Mobile App
Navigate to the `mobile_app` directory:
```bash
cd mobile_app
npm install
npx expo start
```
Use the Expo Go app on your phone or an emulator to test the application.
