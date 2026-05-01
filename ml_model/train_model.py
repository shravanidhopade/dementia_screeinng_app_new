import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import os

def train_and_evaluate():
    data_path = 'dataset_generation/synthetic_dementia_data.csv'
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Please run generate_dataset.py first.")
        return

    # Load dataset
    df = pd.read_csv(data_path)

    # Feature Engineering & Normalization
    X = df.drop(columns=['label'])
    y = df['label']

    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split dataset: 80% training, 20% testing
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)

    # Train Random Forest classifier
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Predictions
    y_pred = model.predict(X_test)

    # Evaluate
    print("\n--- Model Evaluation ---")
    print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    
    # We use macro average because labels are multi-class strings
    print(f"Precision: {precision_score(y_test, y_pred, average='macro'):.4f}")
    print(f"Recall:    {recall_score(y_test, y_pred, average='macro'):.4f}")
    print(f"F1-Score:  {f1_score(y_test, y_pred, average='macro'):.4f}")
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Save trained model and scaler
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    print("\nModel saved to models/model.pkl")
    print("Scaler saved to models/scaler.pkl")

if __name__ == "__main__":
    train_and_evaluate()
