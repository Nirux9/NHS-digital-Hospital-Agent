import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from lightgbm import LGBMClassifier

# ── Directories ─────────────────────────────────────────────────────────────
os.makedirs('models', exist_ok=True)
os.makedirs('reports', exist_ok=True)

# ── 1. Dataset Inspection & Validation ──────────────────────────────────────
csv_file = 'synthetic_triage_data_250k.csv'
if not os.path.exists(csv_file):
    if os.path.exists('synthetic_triage_data.csv'):
        # Create alias file / read from synthetic_triage_data.csv
        df_raw = pd.read_csv('synthetic_triage_data.csv')
        df_raw.to_csv(csv_file, index=False)
    else:
        raise FileNotFoundError("Could not find synthetic_triage_data.csv")
else:
    df_raw = pd.read_csv(csv_file)

rows, cols = df_raw.shape
missing_values = df_raw.isnull().sum().to_dict()
duplicates = int(df_raw.duplicated().sum())

print("=" * 70)
print("1. DATASET AUDIT REPORT")
print(f"Total Rows:        {rows:,}")
print(f"Total Columns:     {cols}")
print(f"Duplicate Rows:    {duplicates}")
print(f"Missing Values:    {missing_values}")

# Confirm features and target
target_col = 'true_severity'
id_col = 'patient_id'

assert id_col in df_raw.columns, "patient_id must be in dataset"
assert target_col in df_raw.columns, "true_severity must be in dataset"

# Exclude patient_id from predictors
feature_cols = [c for c in df_raw.columns if c not in [id_col, target_col]]
print(f"Features ({len(feature_cols)}): {feature_cols}")

# Target distribution
target_counts = df_raw[target_col].value_counts().sort_index().to_dict()
print(f"Target Distribution (true_severity): {target_counts}")

categorical_cols = ['consciousness', 'chief_complaint']
numerical_cols = [c for c in feature_cols if c not in categorical_cols]
print(f"Categorical Features: {categorical_cols}")
print(f"Numerical Features:   {numerical_cols}")

# ── 2. Data Preparation & Stratified Split ─────────────────────────────────
X = df_raw[feature_cols].copy()
y = df_raw[target_col].copy()

# Convert categorical columns to pandas 'category' dtype for LightGBM
for col in categorical_cols:
    X[col] = X[col].astype('category')

# Stratified 70/30 Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.30,
    random_state=42,
    stratify=y
)

print(f"\n2. STRATIFIED TRAIN/TEST SPLIT")
print(f"Train Set: {X_train.shape[0]:,} samples (70%)")
print(f"Test Set:  {X_test.shape[0]:,} samples (30%)")

# ── 3. Train LightGBM Multiclass Model ──────────────────────────────────────
print("\n3. TRAINING LIGHTGBM MODEL...")
lgbm_model = LGBMClassifier(
    n_estimators=150,
    learning_rate=0.05,
    num_leaves=31,
    random_state=42,
    objective='multiclass',
    num_class=len(y.unique()),
    verbose=-1
)

lgbm_model.fit(X_train, y_train)

# ── 4. Calculate Complete Evaluation Metrics ────────────────────────────────
y_pred = lgbm_model.predict(X_test)
y_proba = lgbm_model.predict_proba(X_test)

acc = float(accuracy_score(y_test, y_pred))
prec_macro = float(precision_score(y_test, y_pred, average='macro'))
rec_macro = float(recall_score(y_test, y_pred, average='macro'))
f1_macro = float(f1_score(y_test, y_pred, average='macro'))
f1_weighted = float(f1_score(y_test, y_pred, average='weighted'))

cm = confusion_matrix(y_test, y_pred).tolist()
cls_report = classification_report(y_test, y_pred, output_dict=True)

# Severity level mapping
severity_names = {
    1: 'CRITICAL',
    2: 'EMERGENT',
    3: 'URGENT',
    4: 'LESS_URGENT',
    5: 'NON_URGENT'
}

per_class_metrics = {}
for lvl in sorted(y.unique()):
    str_lvl = str(lvl)
    name = severity_names.get(lvl, f"Level_{lvl}")
    if str_lvl in cls_report:
        per_class_metrics[name] = {
            'level': int(lvl),
            'precision': round(float(cls_report[str_lvl]['precision']), 4),
            'recall': round(float(cls_report[str_lvl]['recall']), 4),
            'f1_score': round(float(cls_report[str_lvl]['f1-score']), 4),
            'support': int(cls_report[str_lvl]['support'])
        }

print("\n4. EVALUATION METRICS ON HELD-OUT TEST SET (75,000 samples)")
print(f"Accuracy:        {acc:.6f}")
print(f"Macro F1-Score:  {f1_macro:.6f}")
print(f"Weighted F1:     {f1_weighted:.6f}")
print(f"Critical Recall: {per_class_metrics.get('CRITICAL', {}).get('recall', 'N/A')}")
print("\nPer-Class Breakdown:")
for k, v in per_class_metrics.items():
    print(f"  {k:<12}: Precision={v['precision']:.4f}, Recall={v['recall']:.4f}, F1={v['f1_score']:.4f}, Support={v['support']}")

# Note on 100% accuracy if achieved
accuracy_note = ""
if acc >= 0.999:
    accuracy_note = "100% accuracy was obtained on the synthetic hold-out test set. This reflects the deterministic structure of the synthetic dataset and must not be interpreted as real-world clinical validation."
    print(f"\nNOTE: {accuracy_note}")

# ── 5. Decision Tree for Explainability (max_depth=3) ───────────────────────
print("\n5. TRAINING SHALLOW DECISION TREE FOR EXPLAINABILITY (max_depth=3)...")
# For Decision Tree, encode categoricals using LabelEncoder/codes
X_train_dt = X_train.copy()
X_test_dt = X_test.copy()
cat_mappings = {}

for col in categorical_cols:
    X_train_dt[col] = X_train_dt[col].cat.codes
    X_test_dt[col] = X_test_dt[col].cat.codes
    # Save category mapping
    cat_mappings[col] = list(X[col].cat.categories)

dt_model = DecisionTreeClassifier(max_depth=3, random_state=42)
dt_model.fit(X_train_dt, y_train)

dt_rules_raw = export_text(dt_model, feature_names=feature_cols)
dt_rules_text = (
    "Rules learned from the synthetic dataset.\n"
    "Disclaimer: These decision rules are extracted for model interpretability on synthetic data only and must not be described as validated medical guidelines.\n\n"
    + dt_rules_raw
)

with open('reports/dt_rules.txt', 'w') as f:
    f.write(dt_rules_text)

# ── 6. Feature Importance Calculation ───────────────────────────────────────
print("\n6. FEATURE IMPORTANCE ANALYSIS...")
importances = lgbm_model.feature_importances_
feat_imp_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': importances
}).sort_values(by='importance', ascending=False).reset_index(drop=True)

feat_imp_df['rank'] = feat_imp_df.index + 1
feat_imp_df.to_csv('reports/feature_importance.csv', index=False)

print(feat_imp_df.to_string(index=False))

# ── 7. Save Models and Metadata ──────────────────────────────────────────────
print("\n7. SAVING MODELS & METADATA...")

# Save LightGBM and Decision Tree models
model_package = {
    'lgbm_model': lgbm_model,
    'feature_names': feature_cols,
    'categorical_features': categorical_cols,
    'cat_mappings': cat_mappings,
    'severity_names': severity_names
}

joblib.dump(model_package, 'models/triage_lgbm_model.pkl')
joblib.dump(dt_model, 'models/triage_dt_model.pkl')

metadata = {
    "model_name": "NHS Emergency Severity Triage LightGBM Predictor",
    "model_version": "1.0.0",
    "training_dataset": csv_file,
    "dataset_size": rows,
    "target_column": target_col,
    "feature_names": feature_cols,
    "categorical_features": categorical_cols,
    "train_ratio": 0.70,
    "test_ratio": 0.30,
    "random_state": 42,
    "training_timestamp": datetime.utcnow().isoformat() + "Z",
    "accuracy_note": accuracy_note,
    "metrics": {
        "accuracy": round(acc, 6),
        "precision_macro": round(prec_macro, 6),
        "recall_macro": round(rec_macro, 6),
        "f1_macro": round(f1_macro, 6),
        "f1_weighted": round(f1_weighted, 6),
        "per_class": per_class_metrics,
        "confusion_matrix": cm
    }
}

with open('models/triage_model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

with open('reports/evaluation_summary.json', 'w') as f:
    json.dump(metadata, f, indent=2)

# Also copy metadata to backend models directory if backend exists
if os.path.exists('backend'):
    os.makedirs('backend/models', exist_ok=True)
    with open('backend/models/triage_model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

print("OK: Saved models/triage_lgbm_model.pkl")
print("OK: Saved models/triage_model_metadata.json")
print("OK: Saved reports/feature_importance.csv")
print("OK: Saved reports/dt_rules.txt")
