import json
import joblib
import pandas as pd
import numpy as np

# Load model package
MODEL_PATH = 'models/triage_lgbm_model.pkl'

_model_package = None

def load_triage_model():
    global _model_package
    if _model_package is None:
        _model_package = joblib.load(MODEL_PATH)
    return _model_package

def predict_triage(input_data: dict) -> dict:
    """
    Accepts patient features dictionary and returns LightGBM triage prediction with probabilities.

    Expected input_data keys:
    - age (int/float)
    - heart_rate (int/float)
    - systolic_bp (int/float)
    - respiratory_rate (int/float)
    - spo2 (int/float)
    - temperature_c (float)
    - consciousness ('A', 'V', 'P', 'U')
    - pain_score (int/float)
    - chest_pain (0 or 1)
    - breathing_difficulty (0 or 1)
    - active_bleeding (0 or 1)
    - chief_complaint (str)
    """
    package = load_triage_model()
    model = package['lgbm_model']
    feature_names = package['feature_names']
    categorical_features = package['categorical_features']
    severity_names = package['severity_names']

    # Convert single dict to DataFrame
    df = pd.DataFrame([input_data])

    # Ensure all required features are present
    for col in feature_names:
        if col not in df.columns:
            raise ValueError(f"Missing required feature: {col}")

    # Set categorical types
    for col in categorical_features:
        df[col] = df[col].astype('category')

    # Order columns exactly as during training
    X_input = df[feature_names]

    # Predict
    pred_class = model.predict(X_input)[0]
    proba_array = model.predict_proba(X_input)[0]

    # Class probabilities dictionary via zip on model.classes_
    classes = [int(c) for c in model.classes_]
    
    probabilities = {}
    raw_probabilities_by_class = {}
    for cls, prob in zip(classes, proba_array):
        prob_val = round(float(prob), 4)
        raw_probabilities_by_class[cls] = prob_val
        label_name = severity_names.get(cls, f"LEVEL_{cls}")
        probabilities[label_name] = prob_val

    # Validate probability sum
    probability_sum = round(sum(raw_probabilities_by_class.values()), 4)
    if abs(probability_sum - 1.0) > 0.01:
        raise ValueError(f"Invalid probability distribution sum: {probability_sum}")

    # Confidence calculation: exact probability of predicted class
    pred_idx = classes.index(int(pred_class))
    predicted_confidence = round(float(proba_array[pred_idx]), 4)
    predicted_label = severity_names.get(int(pred_class), f"LEVEL_{pred_class}")

    # Out-of-Distribution (OOD) Detection against observed training dataset ranges
    feature_ranges = {
        'age': (20.0, 70.0),
        'heart_rate': (65.0, 170.0),
        'systolic_bp': (57.0, 132.0),
        'respiratory_rate': (13.0, 40.0),
        'spo2': (75.0, 99.0),
        'temperature_c': (36.0, 39.4),
        'pain_score': (0.0, 10.0)
    }

    ood_warnings = []
    for feat, (f_min, f_max) in feature_ranges.items():
        if feat in input_data and input_data[feat] is not None:
            val = float(input_data[feat])
            if val < f_min or val > f_max:
                ood_warnings.append(f"{feat}: {val} (training range: {f_min}–{f_max})")

    return {
        "prediction": predicted_label,
        "raw_class": int(pred_class),
        "confidence": predicted_confidence,
        "probabilities": probabilities,
        "probability_sum": probability_sum,
        "is_out_of_distribution": len(ood_warnings) > 0,
        "ood_warnings": ood_warnings,
        "model_classes": classes,
        "model_version": "1.0.0"
    }

if __name__ == "__main__":
    import sys
    
    # Read input from CLI argument if provided, otherwise stdin, fallback to sample
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
    elif not sys.stdin.isatty():
        raw_input = sys.stdin.read()
    else:
        raw_input = None

    if raw_input:
        try:
            patient_data = json.loads(raw_input)
            result = predict_triage(patient_data)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
    else:
        # Quick CLI test fallback
        sample_patient = {
            "age": 55,
            "heart_rate": 130,
            "systolic_bp": 94,
            "respiratory_rate": 34,
            "spo2": 84,
            "temperature_c": 37.7,
            "consciousness": "P",
            "pain_score": 10,
            "chest_pain": 1,
            "breathing_difficulty": 1,
            "active_bleeding": 0,
            "chief_complaint": "cardiac arrest"
        }
        result = predict_triage(sample_patient)
        print(json.dumps(result, indent=2))
