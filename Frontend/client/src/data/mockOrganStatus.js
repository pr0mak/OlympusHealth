// Fixed presentation fixtures, not live readings or diagnostic assessments.
// Measurement context: medlineplus.gov/lab-tests/, medlineplus.gov/kidneytests.html,
// and nei.nih.gov/eye-health-information/healthy-vision/finding-eye-doctor/get-dilated-eye-exam.
const reading = (label, value, unit = "", caption = "") => ({ label, value, unit, caption });
const score = (label, value, accent = "strength") => ({
  label, value, unit: "/ 10", type: "score", accent,
});
const profile = (subtitle, primary, metrics, note = "Fixed demo values. Ratings use an illustrative 1–10 scale.") => ({
  subtitle, primary, metrics, note,
});

const kidney = profile("Kidney filtration and urinary health",
  reading("Kidney filtration (eGFR)", 102, "mL/min/1.73 m²", "Combined kidney estimate · demo"), [
    reading("Creatinine (blood)", 0.9, "mg/dL"),
    reading("Total daily urine", 1.7, "L/day"),
    reading("Protein in urine", "Not detected"),
    score("Flank discomfort", 1, "soreness"),
  ], "Fixed demo values. Filtration and urine readings describe both kidneys together.");

const lung = profile("Breathing and oxygen delivery",
  reading("Blood oxygen", 98, "%", "Shared blood reading · demo"), [
    reading("Breathing rate", 16, "breaths/min"),
    reading("Lung capacity (both)", 4.8, "L"),
    score("Breathlessness", 1, "soreness"),
    score("Breathing comfort", 9),
  ], "Fixed demo values. Oxygen, breathing rate and capacity describe the overall respiratory system.");

const adrenal = profile("Stress hormones and salt balance",
  reading("Morning cortisol", 12, "µg/dL", "Blood hormone reading · demo"), [
    reading("Aldosterone (blood)", 8, "ng/dL"),
    reading("Sodium (blood)", 140, "mmol/L"),
    reading("Potassium (blood)", 4.2, "mmol/L"),
    score("Perceived stress", 3, "fatigue"),
  ], "Fixed demo values. Blood readings provide overall hormone and electrolyte context.");

const ureter = profile("Urine passage and local comfort",
  score("Urinary comfort", 9), [
    score("Flank discomfort", 1, "soreness"),
    score("Urinary discomfort", 1, "soreness"),
    score("Nausea", 1, "fatigue"),
    score("Lower abdominal comfort", 9),
  ], "Fixed demo ratings describe reported comfort around the urinary tract, not measured ureter function.");

const eye = (pressure, strain) => profile("Vision and eye comfort",
  reading("Visual acuity", "20/20", "", "Demo vision assessment"), [
    reading("Eye pressure", pressure, "mmHg"),
    score("Eye strain", strain, "fatigue"),
    score("Dryness", 2, "endurance"),
    score("Light sensitivity", 1, "soreness"),
  ]);

const breast = profile("Breast comfort and reported sensations",
  score("Local comfort", 9), [
    score("Tenderness", 2, "soreness"),
    score("Soreness", 1, "soreness"),
    score("Skin sensitivity", 2, "endurance"),
    score("Tightness", 1, "fatigue"),
  ]);

const ovary = profile("Pelvic comfort and reported sensations",
  score("Pelvic comfort", 9), [
    score("Local discomfort", 1, "soreness"),
    score("Pelvic pressure", 1, "endurance"),
    score("Abdominal bloating", 2, "structure"),
    score("Nausea", 1, "fatigue"),
  ]);

export const mockOrganStatus = {
  breast_l: breast,
  breast_r: breast,
  ovary_l: ovary,
  ovary_r: ovary,
  uterus: profile("Uterine and pelvic comfort",
    score("Pelvic comfort", 8), [
      score("Cramping", 2, "soreness"),
      score("Bloating", 2, "structure"),
      score("Pelvic pressure", 1, "endurance"),
      score("Lower-back discomfort", 1, "fatigue"),
    ]),
  fallopian_tubes: profile("Pelvic comfort and related sensations",
    score("Pelvic comfort", 9), [
      score("Pelvic discomfort", 1, "soreness"),
      score("Abdominal cramps", 1, "endurance"),
      score("Abdominal bloating", 2, "structure"),
      score("Nausea", 1, "fatigue"),
    ], "Fixed demo ratings describe reported pelvic sensations, not measured fallopian-tube function."),
  vagina: profile("Local comfort and reported sensations",
    score("Local comfort", 9), [
      score("Dryness", 2, "endurance"),
      score("Irritation", 1, "soreness"),
      score("Tenderness", 1, "fatigue"),
      score("Pelvic discomfort", 1, "soreness"),
    ]),
  adrenal_l: adrenal,
  adrenal_r: adrenal,
  appendix: profile("Local abdominal comfort",
    score("Lower-right abdominal comfort", 9), [
      score("Local discomfort", 1, "soreness"),
      score("Tenderness", 1, "soreness"),
      score("Nausea", 1, "fatigue"),
      score("Appetite", 8, "endurance"),
    ], "Fixed demo ratings describe reported abdominal sensations, not an appendix diagnosis."),
  brain: profile("Cognition and mental comfort",
    reading("Reaction time", 245, "ms", "Demo response assessment"), [
      score("Concentration", 8),
      score("Memory", 8, "structure"),
      score("Mental fatigue", 3, "fatigue"),
      score("Headache", 1, "soreness"),
    ]),
  brainstem: profile("Automatic regulation and related signals",
    reading("Breathing rate", 16, "breaths/min", "Overall regulation signal · demo"), [
      reading("Heart rate", 65, "bpm"),
      score("Balance", 8),
      score("Swallowing comfort", 9, "structure"),
      score("Dizziness", 1, "soreness"),
    ], "Fixed demo values. These are related whole-body signals, not a direct brainstem assessment."),
  bronchi: profile("Airflow and airway comfort",
    reading("Peak airflow", 520, "L/min", "Whole-airway measurement · demo"), [
      reading("Breathing rate", 16, "breaths/min"),
      score("Cough severity", 1, "soreness"),
      score("Mucus discomfort", 2, "endurance"),
      score("Airway comfort", 9),
    ]),
  cerebellum: profile("Balance and movement coordination",
    score("Balance", 8), [
      score("Movement coordination", 8),
      score("Hand precision", 8, "structure"),
      score("Walking steadiness", 9, "endurance"),
      score("Dizziness", 1, "soreness"),
    ]),
  esophagus: profile("Swallowing and food passage",
    score("Swallowing comfort", 9), [
      score("Food passage comfort", 9),
      score("Reflux discomfort", 2, "endurance"),
      score("Chest discomfort", 1, "soreness"),
      score("Regurgitation severity", 1, "fatigue"),
    ]),
  eye_l: eye(15, 2),
  eye_r: eye(16, 3),
  gallbladder: profile("Digestion and bile-related measurements",
    score("Meal tolerance", 8), [
      reading("Bilirubin (blood)", 0.7, "mg/dL"),
      score("Upper abdominal comfort", 9),
      score("Nausea", 1, "fatigue"),
      score("Abdominal bloating", 2, "endurance"),
    ], "Fixed demo values. Bilirubin is a shared liver and bile-system blood measurement."),
  heart: profile("Heart and circulation",
    reading("Heart rate", 65, "bpm", "Demo pulse reading"), [
      reading("Heart rhythm", "Regular"),
      reading("Blood pressure", "116/74", "mmHg"),
      reading("Blood oxygen", 98, "%"),
      score("Chest comfort", 9),
    ], "Fixed demo values. Blood pressure and oxygen are whole-body readings."),
  kidney_l: kidney,
  kidney_r: kidney,
  colon: profile("Bowel activity and comfort",
    score("Bowel comfort", 8), [
      reading("Daily bowel movements", 1, "per day"),
      score("Ease of bowel movement", 8),
      score("Abdominal bloating", 2, "endurance"),
      score("Bowel urgency", 2, "soreness"),
    ]),
  larynx: profile("Voice and throat comfort",
    score("Voice clarity", 9), [
      score("Vocal fatigue", 2, "fatigue"),
      score("Hoarseness", 1, "endurance"),
      score("Throat discomfort", 1, "soreness"),
      score("Breathing comfort", 9),
    ]),
  liver: profile("Liver-related blood measurements",
    reading("ALT (liver enzyme)", 22, "U/L", "Blood enzyme reading · demo"), [
      reading("AST (enzyme)", 24, "U/L"),
      reading("Bilirubin", 0.7, "mg/dL"),
      reading("Albumin (protein)", 4.3, "g/dL"),
      score("Upper abdominal comfort", 9),
    ]),
  lung_l: lung,
  lung_r: lung,
  reproductive: profile("Reproductive health and comfort",
    reading("Testosterone (blood)", 520, "ng/dL", "System-wide hormone reading · demo"), [
      score("Local comfort", 9),
      score("Pelvic discomfort", 1, "soreness"),
      score("Sexual well-being", 8, "structure"),
      score("Energy level", 8, "endurance"),
    ]),
  pancreas: profile("Blood sugar and digestive context",
    reading("Blood glucose", 92, "mg/dL", "Fasting blood reading · demo"), [
      reading("Insulin (blood)", 6, "µIU/mL"),
      reading("Lipase (enzyme)", 28, "U/L"),
      score("Meal tolerance", 8),
      score("Upper abdominal discomfort", 1, "soreness"),
    ]),
  pharynx: profile("Swallowing and throat comfort",
    score("Swallowing comfort", 9), [
      score("Throat irritation", 1, "soreness"),
      score("Throat dryness", 2, "endurance"),
      score("Cough severity", 1, "fatigue"),
      score("Throat discomfort", 1, "soreness"),
    ]),
  pituitary: profile("Hormone regulation and related signals",
    reading("TSH (hormone)", 1.8, "mIU/L", "Thyroid-stimulating hormone · demo"), [
      reading("Growth hormone", 0.8, "ng/mL"),
      reading("Prolactin (hormone)", 9, "ng/mL"),
      score("Energy level", 8, "endurance"),
      score("Headache", 1, "soreness"),
    ]),
  prostate: profile("Prostate-related measurements and urinary comfort",
    reading("PSA (blood)", 0.8, "ng/mL", "Prostate-related protein · demo"), [
      reading("Urinary flow rate", 18, "mL/s"),
      reading("Night-time urination", 0, "per night"),
      score("Emptying comfort", 9),
      score("Pelvic discomfort", 1, "soreness"),
    ], "Fixed demo values. Flow and comfort describe the wider urinary tract."),
  salivary_glands: profile("Saliva production and oral comfort",
    reading("Saliva flow", 0.4, "mL/min", "Resting saliva measurement · demo"), [
      score("Dry mouth", 2, "endurance"),
      score("Swallowing comfort", 9),
      score("Taste perception", 9, "structure"),
      score("Oral discomfort", 1, "soreness"),
    ]),
  small_intestine: profile("Digestive tolerance and abdominal comfort",
    score("Digestive comfort", 8), [
      score("Food tolerance", 8),
      score("Abdominal bloating", 2, "endurance"),
      score("Abdominal cramps", 1, "soreness"),
      score("Nausea", 1, "fatigue"),
    ]),
  spleen: profile("Blood-cell context and local comfort",
    reading("Platelet count", 240, "×10³/µL", "Shared blood-cell reading · demo"), [
      reading("White blood cells", 6.2, "×10³/µL"),
      reading("Hemoglobin", 14.5, "g/dL"),
      score("Upper-left abdominal comfort", 9),
      score("Tiredness", 2, "fatigue"),
    ], "Fixed demo values. Blood counts describe the overall blood system, not isolated spleen function."),
  stomach: profile("Appetite and digestive comfort",
    score("Digestive comfort", 8), [
      score("Appetite", 8, "endurance"),
      score("Fullness", 4, "structure"),
      score("Nausea", 1, "fatigue"),
      score("Upper abdominal discomfort", 1, "soreness"),
    ]),
  thymus: profile("Immune-cell context",
    reading("T cells (blood)", 1450, "cells/µL", "Shared immune-system reading · demo"), [
      reading("Helper T cells (CD4)", 850, "cells/µL"),
      reading("CD8 T cells", 520, "cells/µL"),
      reading("White blood cells", 6.2, "×10³/µL"),
      score("Fatigue", 2, "fatigue"),
    ], "Fixed demo values. Blood-cell counts provide immune-system context, not a direct thymus assessment."),
  tongue: profile("Tongue movement, taste and comfort",
    score("Tongue mobility", 9), [
      score("Taste perception", 9, "structure"),
      score("Speech clarity", 9),
      score("Swallowing comfort", 9, "endurance"),
      score("Local discomfort", 1, "soreness"),
    ]),
  trachea: profile("Airway and breathing comfort",
    score("Breathing comfort", 9), [
      reading("Breathing rate", 16, "breaths/min"),
      score("Cough severity", 1, "fatigue"),
      score("Airway irritation", 1, "endurance"),
      score("Chest discomfort", 1, "soreness"),
    ]),
  ureter_l: ureter,
  ureter_r: ureter,
  bladder: profile("Bladder emptying and urinary comfort",
    reading("Urine remaining after emptying", 25, "mL", "Demo post-void measurement"), [
      reading("Daily urination", 6, "times/day"),
      score("Bladder fullness", 3, "structure"),
      score("Urgency", 2, "endurance"),
      score("Bladder discomfort", 1, "soreness"),
    ]),
};
