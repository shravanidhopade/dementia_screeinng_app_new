import pandas as pd
import numpy as np
import os

# Create dataset directory if it doesn't exist
os.makedirs('dataset_generation', exist_ok=True)

def generate_dataset(num_samples=1000):
    """
    Generate synthetic dataset for dementia screening tests.
    Columns:
    - memory_accuracy (30-100)
    - reaction_time (250-900 ms)
    - attention_accuracy (30-100)
    - speech_rate (70-160 wpm)
    - pause_duration (0.2-2.5 sec)
    - pitch_variance (10-50 Hz)
    - task_completion_time (10-120 sec)
    - age (50-90)
    - label (Low Risk, Moderate Risk, High Risk)
    """
    np.random.seed(42)

    data = []
    
    for _ in range(num_samples):
        # Determine risk level first to guide feature generation
        rand_val = np.random.rand()
        if rand_val < 0.4:
            label = "Low Risk"
        elif rand_val < 0.75:
            label = "Moderate Risk"
        else:
            label = "High Risk"
            
        # Age distribution
        age = np.random.randint(50, 91)
        
        if label == "Low Risk":
            memory_accuracy = np.random.uniform(80, 100)
            reaction_time = np.random.uniform(250, 450)
            attention_accuracy = np.random.uniform(85, 100)
            speech_rate = np.random.uniform(120, 160)
            pause_duration = np.random.uniform(0.2, 0.8)
            pitch_variance = np.random.uniform(30, 50)
            task_completion_time = np.random.uniform(10, 40)
            
        elif label == "Moderate Risk":
            memory_accuracy = np.random.uniform(50, 85)
            reaction_time = np.random.uniform(400, 650)
            attention_accuracy = np.random.uniform(50, 90)
            speech_rate = np.random.uniform(90, 130)
            pause_duration = np.random.uniform(0.6, 1.5)
            pitch_variance = np.random.uniform(20, 40)
            task_completion_time = np.random.uniform(30, 80)
            
        else: # High Risk
            memory_accuracy = np.random.uniform(30, 60)
            reaction_time = np.random.uniform(600, 900)
            attention_accuracy = np.random.uniform(30, 65)
            speech_rate = np.random.uniform(70, 100)
            pause_duration = np.random.uniform(1.2, 2.5)
            pitch_variance = np.random.uniform(10, 25)
            task_completion_time = np.random.uniform(60, 120)
            
        # Add some noise
        memory_accuracy = min(100, memory_accuracy + np.random.normal(0, 5))
        attention_accuracy = min(100, attention_accuracy + np.random.normal(0, 5))

        data.append([
            round(memory_accuracy, 2),
            round(reaction_time, 2),
            round(attention_accuracy, 2),
            round(speech_rate, 2),
            round(pause_duration, 2),
            round(pitch_variance, 2),
            round(task_completion_time, 2),
            age,
            label
        ])

    columns = [
        'memory_accuracy', 'reaction_time', 'attention_accuracy',
        'speech_rate', 'pause_duration', 'pitch_variance',
        'task_completion_time', 'age', 'label'
    ]

    df = pd.DataFrame(data, columns=columns)
    filepath = 'dataset_generation/synthetic_dementia_data.csv'
    df.to_csv(filepath, index=False)
    print(f"Dataset generated successfully! Setup {num_samples} samples at {filepath}")

if __name__ == "__main__":
    generate_dataset(1000)
