# Sprint 1 Data Analytics

## Scope

This report covers the Sprint 1 data audit and exploratory analysis for the Emergency Severity Triage dataset. It is limited to data analytics and does not describe frontend implementation or deployment.

## Dataset Overview

| Measure | Result |
|---|---:|
| Records | 250,000 |
| Columns | 14 |
| Model features | 11 |
| Target | `true_severity` |
| Missing values | 0 |
| Duplicate rows | 0 |
| Training records | 175,000 |
| Test records | 75,000 |

### Dataset fields

`patient_id`, `age`, `heart_rate`, `systolic_bp`, `respiratory_rate`, `spo2`, `temperature_c`, `consciousness`, `pain_score`, `chest_pain`, `breathing_difficulty`, `active_bleeding`, `chief_complaint`, and `true_severity`.

The model excludes identifiers and text fields (`patient_id`, `chief_complaint`) and uses the remaining 11 structured fields as predictors.

## Data Quality Audit

The audit found no missing values and no duplicate records across the 250,000-row dataset. Numeric ranges are internally populated and suitable for exploratory analysis. The binary indicators are represented as 0/1 values, and consciousness is represented using AVPU categories (`A`, `V`, `P`, `U`).

The dataset is synthetic and should therefore be treated as a development and validation resource, not as evidence of clinical performance on real patients.

## Severity Distribution

| Severity level | Patient count | Percentage |
|---|---:|---:|
| Level 1 | 7,000 | 2.8% |
| Level 2 | 33,500 | 13.4% |
| Level 3 | 85,250 | 34.1% |
| Level 4 | 81,250 | 32.5% |
| Level 5 | 43,000 | 17.2% |
| **Total** | **250,000** | **100.0%** |

Levels 1 and 2 together contain 40,500 patients, or 16.2% of the dataset. These levels represent the urgent-care grouping used by the binary model.

## Descriptive Statistics

| Feature | Mean | Standard deviation | Minimum | Median | Maximum |
|---|---:|---:|---:|---:|---:|
| Age | 45.18 | 13.30 | 20 | 45 | 70 |
| Heart rate | 95.04 | 18.49 | 65 | 91 | 170 |
| Systolic BP | 113.79 | 12.18 | 57 | 116 | 132 |
| Respiratory rate | 19.33 | 4.49 | 13 | 18 | 40 |
| SpO2 | 95.15 | 3.55 | 75 | 96 | 99 |
| Temperature (C) | 37.59 | 0.65 | 36.0 | 37.5 | 39.4 |
| Pain score | 4.10 | 2.26 | 0 | 4 | 10 |
| Chest pain | 0.20 | 0.40 | 0 | 0 | 1 |
| Breathing difficulty | 0.15 | 0.36 | 0 | 0 | 1 |
| Active bleeding | 0.08 | 0.28 | 0 | 0 | 1 |

## Correlation With Severity

Pearson correlation was calculated between numeric predictors and `true_severity`. Because lower ESI numbers represent greater emergency severity, negative correlations indicate that the feature tends to increase as the patient becomes more urgent.

| Feature | Correlation |
|---|---:|
| Heart rate | -0.882 |
| Pain score | -0.869 |
| Respiratory rate | -0.836 |
| Temperature (C) | -0.603 |
| Breathing difficulty | -0.475 |
| Active bleeding | -0.392 |
| Chest pain | -0.357 |
| Age | 0.013 |
| Systolic BP | 0.683 |
| SpO2 | 0.835 |

The strongest relationships are heart rate, pain score, respiratory rate, SpO2, and systolic blood pressure. Age has almost no linear correlation with the target in this dataset.

## Sprint 1 Analytics Conclusions

1. The dataset is complete and internally consistent for the current development analysis.
2. All five severity classes are represented, although Levels 1 and 2 form a smaller urgent-care group than Levels 3 and 4.
3. Physiological measurements show the strongest association with severity, especially heart rate, pain score, respiratory rate, SpO2, and systolic blood pressure.
4. Age contributes little linear signal in the current dataset and should not be treated as a primary triage indicator without additional evidence.
5. The results are exploratory. Clinical validation, bias analysis, calibration, and evaluation on real-world data remain future work.

## Reproducibility

The analysis can be rerun from the project directory with:

```powershell
python test_and_analyze.py
```

The source dataset is `synthetic_triage_data.csv`, and the analysis logic is in `test_and_analyze.py` and `triage_model.py`.
