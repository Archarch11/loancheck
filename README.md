# Future Stability Check – Rupa (MVP)

Future Stability Check is a **mobile‑first, conversational web experience** that helps first‑time home buyers understand whether a home loan is likely to remain comfortable under future changes – not just whether they are eligible today.

This MVP is a static, client‑side prototype built with vanilla HTML, CSS and JavaScript. It focuses on a **single guided flow** with one core stress‑testing scenario (income dip).

## Running the MVP

No build tools are required.

1. Open `index.html` directly in a modern browser (Chrome, Edge, Safari).
2. View it on a mobile device or narrow your desktop window to ~375–430px to see the intended layout.

## Experience Overview

- **Entry banner**: Mirrors the home‑loan page banner with the CTA “Check My Future Stability”.
- **Chat‑led interface**: A single‑column, thumb‑friendly chat layout driven by the AI guide **Rupa**.
- **Initial inputs**:
  - Property value (slider)
  - Monthly take‑home income
  - Optional preferred EMI range (slider)
- **Soft eligibility estimate**: Displays an indicative loan range and asks whether to:
  - “Predict my future finances”, or
  - “Stress test my finances”
- **Predict my future finances**:
  - Guided questions on income stability, savings buffer and risk comfort (tap‑based chips).
- **Loan options**:
  - Three illustrative cards: **Stable**, **Balanced**, **Stretched**
  - Each shows EMI, tenure, interest type and a comfort note.
- **Stress testing (Income dip)**:
  - Slider from 10–40% income reduction.
  - Explains impact on EMI comfort and surplus, with comfort / caution / stress messaging and savings buffer reflection.
- **Confidence checkpoint**:
  - Quick reflection: “Feels comfortable / slightly risky / too stressful”.
  - Rupa responds by acknowledging the feeling and (when relevant) gently nudging towards safer alternatives without pressure.
- **Final action**:
  - Primary CTA: “Proceed with this loan”
  - Secondary CTA: “Talk to a loan advisor”

## Important Notes

- All numbers and outcomes are **illustrative only** and are **not** approvals, offers or financial advice.
- There are **no document uploads, no hard eligibility checks and no predictive guarantees**.
- In production, this flow should be integrated with real risk, pricing and eligibility engines, and connected to authenticated user data where appropriate.

