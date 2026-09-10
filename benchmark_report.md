# Emergency Severity Triage Model — LightGBM Benchmark & Audit Report

**Date:** 2026-08-22  
**Dataset:** `synthetic_triage_data_250k.csv`  
**Model Architecture:** LightGBM Multiclass Classifier (`LGBMClassifier`) + Shallow Decision Tree Explainability (`max_depth=3`)  
**Split Ratio:** 70% Train (175,000) / 30% Test (75,000) (Stratified)

---

## 1. Dataset Quality Audit & Validation

The dataset contains 250,000 synthetic clinical emergency triage records across 14 columns.

### Audit Summary

- **Total Rows:** 250,000
- **Total Columns:** 14
- **Missing Values:** 0 across all features
- **Duplicate Records:** 0
- **Excluded Features:** `patient_id` (identifier, excluded from model training)
- **Target Variable:** `true_severity` (ESI Levels 1 to 5)

### Target Distribution

| Severity Level | ESI Category | Test Count (30%) | Proportion |
|---|---|---|---|
| Level 1 | CRITICAL | 2,100 | 2.8% |
| Level 2 | EMERGENT | 10,050 | 13.4% |
| Level 3 | URGENT | 25,575 | 34.1% |
| Level 4 | LESS_URGENT | 24,375 | 32.5% |
| Level 5 | NON_URGENT | 12,900 | 17.2% |
| **Total** | | **75,000** | **100.0%** |

### Feature Types

- **Categorical Features (2):** `consciousness` (`A`, `V`, `P`, `U`), `chief_complaint` (Text category). *Native pandas category encoding preserved for LightGBM.*
- **Numerical Features (10):** `age`, `heart_rate`, `systolic_bp`, `respiratory_rate`, `spo2`, `temperature_c`, `pain_score`, `chest_pain`, `breathing_difficulty`, `active_bleeding`.

---

## 2. Evaluation Metrics (Held-Out Test Set: 75,000 Records)

Metrics calculated on the 30% held-out test set (`random_state=42`, `stratify=y`):

- **Accuracy:** `1.000000` (100.0%)
- **Macro Precision:** `1.000000`
- **Macro Recall:** `1.000000`
- **Macro F1-Score:** `1.000000`
- **Weighted F1-Score:** `1.000000`

### Per-Class Performance Breakdown

| Class | Severity Name | Precision | Recall | F1-Score | Test Support |
|---|---|---|---|---|---|
| **Level 1** | CRITICAL | 1.0000 | **1.0000** | 1.0000 | 2,100 |
| **Level 2** | EMERGENT | 1.0000 | 1.0000 | 1.0000 | 10,050 |
| **Level 3** | URGENT | 1.0000 | 1.0000 | 1.0000 | 25,575 |
| **Level 4** | LESS_URGENT | 1.0000 | 1.0000 | 1.0000 | 24,375 |
| **Level 5** | NON_URGENT | 1.0000 | 1.0000 | 1.0000 | 12,900 |

### Critical Class Focus
- **Critical Recall:** `1.0000` (2,100 / 2,100 critical patients correctly flagged with zero false negatives).

---

## 3. LightGBM Feature Importance Ranking

Feature importance ranked by LightGBM split gain (`reports/feature_importance.csv`):

| Rank | Feature | Importance Score | Clinical Context |
|---|---|---|---|
| 1 | `heart_rate` | 3,708 | Tachycardia / Bradycardia indicator |
| 2 | `spo2` | 3,363 | Oxygen saturation percentage |
| 3 | `systolic_bp` | 3,182 | Blood pressure / Haemodynamic stability |
| 4 | `pain_score` | 2,879 | Patient-reported pain severity (0-10) |
| 5 | `temperature_c` | 2,869 | Fever / Hypothermia marker |
| 6 | `respiratory_rate` | 2,847 | Respiratory distress indicator |
| 7 | `age` | 2,157 | Patient age demographic |
| 8 | `chief_complaint` | 537 | Specific clinical presentation |
| 9 | `active_bleeding` | 349 | Haemorrhage indicator |
| 10 | `breathing_difficulty` | 332 | Dyspnoea flag |
| 11 | `chest_pain` | 162 | Cardiac symptom indicator |
| 12 | `consciousness` | 9 | AVPU neurological score |

---

## 4. Explainability Decision Tree Rules (`max_depth=3`)

*Rules learned from the synthetic dataset.*  
*Disclaimer: These decision rules are extracted for model interpretability on synthetic data only and must not be described as validated medical guidelines.*

```text
|--- heart_rate <= 119.50
|   |--- pain_score <= 5.50
|   |   |--- pain_score <= 2.50
|   |   |   |--- class: 4 (LESS_URGENT)
|   |   |--- pain_score >  2.50
|   |   |   |--- class: 4 (LESS_URGENT)
|   |--- pain_score >  5.50
|   |   |--- heart_rate <= 99.50
|   |   |   |--- class: 3 (URGENT)
|   |   |--- heart_rate >  99.50
|   |   |   |--- class: 3 (URGENT)
|--- heart_rate >  119.50
|   |--- respiratory_rate <= 29.50
|   |   |--- heart_rate <= 139.50
|   |   |   |--- class: 2 (EMERGENT)
|   |   |--- heart_rate >  139.50
|   |   |   |--- class: 2 (EMERGENT)
|   |--- respiratory_rate >  29.50
|   |   |--- spo2 <= 89.50
|   |   |   |--- class: 1 (CRITICAL)
|   |   |--- spo2 >  89.50
|   |   |   |--- class: 1 (CRITICAL)
```

---

## 5. Important Finding & Dataset Limitation Notice

> **100% accuracy was obtained on the synthetic hold-out test set. This reflects the deterministic structure of the synthetic dataset and must not be interpreted as real-world clinical validation.**

The synthetic data generation rules follow deterministic ranges (e.g. `heart_rate > 120` combined with `spo2 < 90` deterministically maps to ESI Level 1 or 2). While LightGBM learns these boundary trees perfectly, real-world emergency patient presentations contain noise, non-linear complications, and multi-morbidity that require prospective clinical validation before clinical deployment.

---

## 6. Exported Model Artifacts

| File | Description |
|---|---|
| `models/triage_lgbm_model.pkl` | Trained LightGBM model package with feature mappings |
| `models/triage_dt_model.pkl` | Shallow Decision Tree model (`max_depth=3`) |
| `models/triage_model_metadata.json` | Complete metadata & calculated test metrics |
| `reports/feature_importance.csv` | Feature importance ranking table |
| `reports/dt_rules.txt` | Extracted human-readable decision rules |
| `ml_inference.py` | Standalone Python prediction interface function `predict_triage(data)` |
