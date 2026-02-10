const chatWindow = document.getElementById("chat-window");
const inputPanel = document.getElementById("input-panel");
const startBtn = document.getElementById("start-check-btn");
const overlay = document.getElementById("rupa-overlay");
const closeBtn = document.getElementById("close-rupa-btn");
const freeChatInput = document.getElementById("free-chat-input");
const freeChatSendBtn = document.getElementById("free-chat-send-btn");

const state = {
  step: "idle",
  propertyValue: null,
  income: null,
  preferredEmiMin: null,
  preferredEmiMax: null,
  profile: {
    incomeStability: null,
    savingsBuffer: null,
    riskComfort: null,
  },
  baseLoanOptions: [],
  selectedScenario: "incomeDip",
  lastScenarioResult: null,
};

function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return "₹0";
  return "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
}

function addAgentMessage(text, opts = {}) {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble agent";

  let html = "";
  if (opts.tag) {
    html += `<div class="chat-bubble-tag"><span class="chat-bubble-tag-dot"></span>${opts.tag}</div>`;
  }
  if (opts.meta) {
    html += `<div class="bubble-meta">${opts.meta}</div>`;
  }
  const body = Array.isArray(text) ? text.join("<br/><br/>") : text;
  html += `<div>${body}</div>`;
  if (opts.subtext) {
    html += `<div class="chat-bubble-subtext">${opts.subtext}</div>`;
  }

  bubble.innerHTML = html;
  chatWindow.appendChild(bubble);
  scrollToBottom();
}

function addUserMessage(text) {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble user";
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  scrollToBottom();
}

function setPanelContent(html) {
  inputPanel.innerHTML = "";
  const card = document.createElement("div");
  card.className = "panel-card";
  card.innerHTML = html;
  inputPanel.appendChild(card);
}

function buildInitialInputsStep() {
  state.step = "initialInputs";

  addAgentMessage(
    "Hey, I’m Rupa 👋 I’m here to help you with your loan requirements — because your financial security matters to us. Let’s quickly understand what you’re planning so I can guide you better.",
    { meta: "Rupa • Future Stability Check" }
  );

  setPanelContent(`
    <div class="panel-header">
      <span class="panel-dot"></span>
      Tell me a bit about this home
    </div>

    <div class="field-group">
      <label class="field-label" for="property-input">
        <span>Property value (approx.)</span>
      </label>
      <input
        id="property-input"
        type="number"
        inputmode="decimal"
        class="text-input"
        placeholder="e.g. 75,00,000"
      />
    </div>

    <div class="field-group">
      <label class="field-label" for="income-input">
        <span>Monthly take-home income</span>
      </label>
      <input id="income-input" type="number" inputmode="decimal" class="text-input" placeholder="e.g. 85,000" />
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>Preferred EMI range <span style="font-weight:400;">(optional)</span></span>
      </div>
      <div class="range-row">
        <input id="emi-range" type="range" min="10000" max="150000" step="5000" value="30000" />
        <output id="emi-output" class="range-output-strong">${formatCurrency(30000)}</output>
      </div>
    </div>

    <div class="primary-row">
      <button class="primary-btn" id="initial-continue-btn">Continue</button>
      <button class="secondary-link" id="skip-emi-btn">Skip EMI preference</button>
    </div>
  `);

  const pvInput = document.getElementById("property-input");
  const emiRange = document.getElementById("emi-range");
  const emiOut = document.getElementById("emi-output");
  emiRange.addEventListener("input", () => {
    emiOut.textContent = formatCurrency(emiRange.value);
  });

  document
    .getElementById("initial-continue-btn")
    .addEventListener("click", handleInitialContinue);
  document
    .getElementById("skip-emi-btn")
    .addEventListener("click", () => {
      emiRange.value = "";
      emiOut.textContent = "Not set";
      handleInitialContinue();
    });
}

function handleInitialContinue() {
  const pvInput = document.getElementById("property-input");
  const pvVal = pvInput ? Number(pvInput.value || 0) : 0;
  const incomeVal = Number(document.getElementById("income-input").value || 0);
  const emiSlider = document.getElementById("emi-range");
  const emiVal = emiSlider.value ? Number(emiSlider.value) : null;

  if (!pvVal || !incomeVal || incomeVal <= 0) {
    addAgentMessage(
      "Could you share both an approximate property value and your monthly take‑home income? This helps me give you a meaningful early estimate."
    );
    return;
  }

  state.propertyValue = pvVal;
  state.income = incomeVal;
  if (emiVal) {
    state.preferredEmiMin = emiVal * 0.8;
    state.preferredEmiMax = emiVal * 1.2;
  }

  addUserMessage(
    `Property ~${formatCurrency(pvVal)}, monthly take‑home ~${formatCurrency(
      incomeVal
    )}${emiVal ? `, preferred EMI ~${formatCurrency(emiVal)}` : ""}.`
  );

  showSoftEligibility();
}

function estimateLoanBands() {
  const maxEmiFromIncome = state.income * 0.4;
  const tentativeEmi = state.preferredEmiMax
    ? Math.min(maxEmiFromIncome, state.preferredEmiMax)
    : maxEmiFromIncome * 0.85;
  const annualRate = 0.09;
  const tenureYears = 20;
  const n = tenureYears * 12;
  const r = annualRate / 12;
  const loanAmount = (tentativeEmi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
  const bandLow = loanAmount * 0.9;
  const bandHigh = loanAmount * 1.1;
  return {
    low: bandLow,
    high: bandHigh,
    referenceEmi: tentativeEmi,
  };
}

function showSoftEligibility() {
  state.step = "softEligibility";
  inputPanel.innerHTML = "";

  const { low, high } = estimateLoanBands();

  addAgentMessage(
    [
      `Based on what you’ve shared, you may be eligible for a home loan of approximately ${formatCurrency(
        low
      )} – ${formatCurrency(high)}.`,
      "This is an early estimate and may change after detailed checks.",
    ],
    {
      tag: "Soft eligibility (illustrative)",
    }
  );

  // Render quick‑action pills directly on the background (no white panel)
  inputPanel.innerHTML = `
    <div class="quick-actions">
      <button class="chip-btn" id="qa-future">
        <span class="dot"></span> Predict my future finances
      </button>
      <button class="chip-btn" id="qa-stress">
        <span class="dot"></span> Stress test my finances
      </button>
    </div>
  `;

  document.getElementById("qa-future").addEventListener("click", () => {
    addUserMessage("Predict my future finances");
    buildFutureProfileQuestions();
  });

  document.getElementById("qa-stress").addEventListener("click", () => {
    addUserMessage("Stress test my finances");
    buildStressTesting(true);
  });
}

function buildFutureProfileQuestions() {
  state.step = "futureProfile";
  inputPanel.innerHTML = "";

  addAgentMessage(
    [
      "To understand how stable this loan could feel over time, I’ll quickly ask about your income, savings and your comfort with risk.",
    ],
    { tag: "Predict my future finances" }
  );

  setPanelContent(`
    <div class="panel-header">
      <span class="panel-dot"></span>
      Tell me about your financial pattern
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>How does your income usually behave?</span>
      </div>
      <div class="pill-options" id="q-income">
        <button class="pill-option" data-value="stable">Mostly the same every month</button>
        <button class="pill-option" data-value="slight">Changes a little month to month</button>
        <button class="pill-option" data-value="uncertain">Changes a lot / uncertain</button>
      </div>
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>If needed, how long could your savings support you?</span>
      </div>
      <div class="pill-options" id="q-savings">
        <button class="pill-option" data-value="lt3">Less than 3 months</button>
        <button class="pill-option" data-value="3to6">3–6 months</button>
        <button class="pill-option" data-value="gt6">More than 6 months</button>
      </div>
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>How do you usually handle financial ups and downs?</span>
      </div>
      <div class="pill-options" id="q-risk">
        <button class="pill-option" data-value="safety">I prefer stability and safety</button>
        <button class="pill-option" data-value="some">I’m okay with some fluctuation</button>
        <button class="pill-option" data-value="risk">I’m comfortable taking risks</button>
      </div>
    </div>

    <div class="primary-row">
      <button class="primary-btn" id="profile-continue-btn">See loan options</button>
    </div>
  `);

  ["q-income", "q-savings", "q-risk"].forEach((id) => {
    const container = document.getElementById(id);
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-option");
      if (!btn) return;
      Array.from(container.children).forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
      const val = btn.dataset.value;
      if (id === "q-income") state.profile.incomeStability = val;
      if (id === "q-savings") state.profile.savingsBuffer = val;
      if (id === "q-risk") state.profile.riskComfort = val;
    });
  });

  document
    .getElementById("profile-continue-btn")
    .addEventListener("click", handleProfileContinue);
}

function handleProfileContinue() {
  const { incomeStability, savingsBuffer, riskComfort } = state.profile;
  if (!incomeStability || !savingsBuffer || !riskComfort) {
    addAgentMessage("Tap one option in each of the three questions so I can reflect your profile accurately.");
    return;
  }

  addUserMessage("Shared my income pattern, savings buffer and risk comfort.");

  addAgentMessage(
    "Here’s what I understand so far: your income predictability, savings buffer, and risk comfort will be used to guide suitable loan options."
  );

  buildLoanOptions();
}

function buildLoanOptions() {
  state.step = "loanOptions";

  const { referenceEmi } = estimateLoanBands();
  const income = state.income || 1;
  const safeRatio = 0.3;
  const maxRatio = 0.45;

  const profileScore = computeProfileScore();

  const stableEmi = Math.min(referenceEmi * 0.85, income * safeRatio);
  const balancedEmi = Math.min(referenceEmi, income * (safeRatio + 0.05));
  const stretchedEmi = Math.min(referenceEmi * 1.15, income * maxRatio);

  state.baseLoanOptions = [
    {
      label: "Stable",
      tagClass: "stable",
      emi: stableEmi,
      tenureYears: 25,
      interestType: "Fixed + floating mix",
      riskLevel: "low",
      comfortNote:
        profileScore >= 2
          ? "Designed to stay comfortable even with some changes in income or expenses."
          : "Keeps room for essentials and savings before EMI each month.",
    },
    {
      label: "Balanced",
      tagClass: "balanced",
      emi: balancedEmi,
      tenureYears: 20,
      interestType: "Standard floating",
      riskLevel: "medium",
      comfortNote:
        profileScore >= 2
          ? "Balances faster loan repayment with a reasonable comfort buffer."
          : "May feel slightly tight in some months if expenses increase.",
    },
    {
      label: "Stretched",
      tagClass: "stretched",
      emi: stretchedEmi,
      tenureYears: 20,
      interestType: "Floating",
      riskLevel: "high",
      comfortNote:
        profileScore >= 2
          ? "Best suited for higher risk comfort and strong savings back‑up."
          : "Could feel stressful if income dips or expenses rise together.",
    },
  ];

  const cardsHtml = state.baseLoanOptions
    .map(
      (opt) => `
      <article class="loan-card">
        <div class="loan-card-header">
          <span>${opt.label} option</span>
          <span class="loan-tag ${opt.tagClass}">${opt.label}</span>
        </div>
        <div class="loan-metrics">
          <span><strong>EMI:</strong> ${formatCurrency(opt.emi)}</span>
          <span><strong>Tenure:</strong> ${opt.tenureYears} years</span>
          <span><strong>Interest type:</strong> ${opt.interestType}</span>
        </div>
        <div class="chat-bubble-subtext" style="margin-top:6px;">
          ${opt.comfortNote}
        </div>
      </article>
    `
    )
    .join("");

  addAgentMessage(
    [
      "Here are some illustrative loan shapes that fit your current plan.",
      "These are not offers or approvals, but examples to help you see the trade‑offs between comfort and speed of repayment.",
    ],
    { tag: "Loan options (illustrative)" }
  );

  setPanelContent(`
    <div class="panel-header">
      <span class="panel-dot"></span>
      Loan options that fit your current plan
    </div>
    <div class="loan-card-grid">
      ${cardsHtml}
    </div>
    <div class="quick-actions loan-actions">
      <button class="chip-btn" id="qa-stress-options">
        <span class="dot"></span> Stress test my options
      </button>
      <button class="chip-btn" id="qa-compare">
        <span class="dot"></span> Compare trade-offs
      </button>
    </div>
  `);

  document.getElementById("qa-stress-options").addEventListener("click", () => {
    addUserMessage("Stress test my options");
    buildStressTesting(false);
  });

  document.getElementById("qa-compare").addEventListener("click", () => {
    addUserMessage("Compare trade-offs");
    explainTradeOffs();
  });
}

function explainTradeOffs() {
  const { baseLoanOptions } = state;
  if (!baseLoanOptions.length) return;
  const [stable, balanced, stretched] = baseLoanOptions;

  addAgentMessage(
    [
      `• <strong>Stable</strong>: Lower EMI (${formatCurrency(
        stable.emi
      )}) and longer tenure keep more room each month for essentials, goals and emergencies.`,
      `• <strong>Balanced</strong>: EMI (${formatCurrency(
        balanced.emi
      )}) is higher but still aims for a moderate comfort buffer, helping you close the loan sooner.`,
      `• <strong>Stretched</strong>: Highest EMI (${formatCurrency(
        stretched.emi
      )}) reduces tenure but can feel tight if income or expenses move unexpectedly.`,
      "You can stress test these options next to see how they behave if things change.",
    ],
    { tag: "Comparing trade‑offs" }
  );
}

function computeProfileScore() {
  let score = 0;
  if (state.profile.incomeStability === "stable") score += 1;
  if (state.profile.savingsBuffer === "gt6") score += 1;
  if (state.profile.riskComfort === "risk") score += 1;
  return score;
}

function buildStressTesting(fromSoftEligibility) {
  state.step = "stressTesting";
  const baseEmi =
    state.baseLoanOptions[0]?.emi || estimateLoanBands().referenceEmi || state.income * 0.35;

  if (fromSoftEligibility) {
    addAgentMessage(
      [
        "Let’s start with an income dip scenario. You’ll be able to see in plain language how your EMI might feel if your income temporarily falls.",
      ],
      { tag: "Stress testing (income dip)" }
    );
  } else {
    addAgentMessage("Let’s see how your EMIs might feel if your income dips for a while.", {
      tag: "Stress testing (income dip)",
    });
  }

  setPanelContent(`
    <div class="panel-header">
      <span class="panel-dot"></span>
      Income dip – what if your income drops?
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>Income dip</span>
        <span class="value-pill"><span id="income-dip-label">20%</span> lower</span>
      </div>
      <div class="range-row">
        <input id="income-dip-range" type="range" min="10" max="40" step="5" value="20" />
        <output id="income-dip-output"></output>
      </div>
    </div>

    <div class="scenario-result" id="income-dip-result"></div>

    <div class="primary-row">
      <button class="primary-btn" id="check-confidence-btn">Check my confidence</button>
      <button class="secondary-link" id="try-another-scenario-btn">Try another scenario</button>
    </div>
    <div class="legal-text">
      These are simplified illustrations to help you think about comfort levels. They are not financial advice or approval decisions.
    </div>
  `);

  function recalc() {
    const slider = document.getElementById("income-dip-range");
    const label = document.getElementById("income-dip-label");
    const output = document.getElementById("income-dip-output");
    const resultEl = document.getElementById("income-dip-result");

    const dipPercent = Number(slider.value);
    label.textContent = `${dipPercent}%`;

    const incomeAfterDip = state.income * (1 - dipPercent / 100);
    const surplus = incomeAfterDip - baseEmi;
    const surplusRatio = surplus / incomeAfterDip;

    let tone = "";
    let statusClass = "";
    if (surplusRatio >= 0.25) {
      tone =
        "Even with this dip, you’d have a healthy buffer after EMI for living expenses and savings.";
      statusClass = "comfortable";
    } else if (surplusRatio >= 0.1) {
      tone =
        "You’d still manage, but you may need to be more intentional with monthly spends until income stabilises.";
      statusClass = "caution";
    } else {
      tone =
        "At this dip level, the EMI could feel stressful. You might need to cut back on several areas or rely on savings.";
      statusClass = "stress";
    }

    const monthsCover =
      state.profile.savingsBuffer === "gt6"
        ? "6+ months"
        : state.profile.savingsBuffer === "3to6"
        ? "around 3–6 months"
        : "less than 3 months";

    output.textContent = `Income after dip: ${formatCurrency(
      incomeAfterDip
    )} • EMI around ${formatCurrency(baseEmi)}`;

    resultEl.innerHTML = `
      <span class="status-pill ${statusClass}">
        <span class="panel-dot"></span>
        ${statusClass === "comfortable" ? "Feels broadly comfortable" : statusClass === "caution" ? "Needs some caution" : "High stress"}
      </span>
      <div style="margin-top:4px;">
        ${tone}
      </div>
      <div class="chat-bubble-subtext">
        Your savings could support you for ${monthsCover} if you maintained similar monthly spends.
      </div>
    `;

    state.lastScenarioResult = { dipPercent, tone, statusClass };
  }

  recalc();
  document.getElementById("income-dip-range").addEventListener("input", recalc);

  document
    .getElementById("check-confidence-btn")
    .addEventListener("click", buildConfidenceCheckpoint);

  document
    .getElementById("try-another-scenario-btn")
    .addEventListener("click", () => {
      addAgentMessage(
        "In this early version, we start with income dip as the core scenario. More scenarios like rate changes and expense shifts can be added later."
      );
    });
}

function buildConfidenceCheckpoint() {
  state.step = "confidence";

  addAgentMessage(
    "Based on everything you’ve seen so far, how does this loan feel to you?",
    { tag: "Confidence checkpoint" }
  );

  setPanelContent(`
    <div class="panel-header">
      <span class="panel-dot"></span>
      How are you feeling about this?
    </div>
    <div class="pill-options" id="confidence-options">
      <button class="pill-option" data-value="comfortable">Feels comfortable</button>
      <button class="pill-option" data-value="slightly-risky">Feels slightly risky</button>
      <button class="pill-option" data-value="too-stressful">Feels too stressful</button>
    </div>
  `);

  document
    .getElementById("confidence-options")
    .addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-option");
      if (!btn) return;
      const feeling = btn.dataset.value;
      let label = "";
      if (feeling === "comfortable") label = "Feels comfortable";
      if (feeling === "slightly-risky") label = "Feels slightly risky";
      if (feeling === "too-stressful") label = "Feels too stressful";
      addUserMessage(label);
      handleConfidenceResponse(feeling);
    });
}

function handleConfidenceResponse(feeling) {
  let message;
  if (feeling === "comfortable") {
    message =
      "I’m glad this feels comfortable. Your reflections on income, savings and stress scenarios suggest this loan shape could work for you, as long as you keep reviewing it when life changes.";
  } else if (feeling === "slightly-risky") {
    message =
      "Thank you for sharing that. It’s completely normal for a home loan to feel slightly risky. We could consider nudging towards the more stable EMI option or a slightly longer tenure to create extra breathing room.";
  } else {
    message =
      "It’s important that your home loan doesn’t feel overwhelming. We can explore safer structures — like a lower EMI, longer tenure, or phasing the purchase timeline — so that your day‑to‑day life remains manageable.";
  }

  addAgentMessage(message, {
    tag: "Your comfort matters",
  });

  buildFinalAction();
}

function buildFinalAction() {
  state.step = "final";

  setPanelContent(`
    <div class="panel-header">
      <span class="panel-dot"></span>
      What would you like to do next?
    </div>
    <div class="field-group">
      <button class="primary-btn" id="proceed-loan-btn">Proceed with this loan</button>
      <button class="chip-btn" id="talk-advisor-btn" style="margin-top:6px;">
        <span class="dot"></span> Talk to a loan advisor
      </button>
    </div>
    <div class="legal-text">
      A relationship manager can help you review this in more detail and walk you through documents, eligibility checks and next steps.
    </div>
  `);

  document.getElementById("proceed-loan-btn").addEventListener("click", () => {
    addUserMessage("Proceed with this loan");
    addAgentMessage(
      "Great. In the next step, we’ll move from this comfort check into a more detailed application journey where we look at documents and eligibility in depth.",
      { tag: "Next step" }
    );
  });

  document.getElementById("talk-advisor-btn").addEventListener("click", () => {
    addUserMessage("Talk to a loan advisor");
    addAgentMessage(
      "I’ll connect you with a relationship manager who can walk through your situation and help you fine‑tune the loan structure at your pace. There’s no pressure to decide immediately.",
      { tag: "Human support" }
    );
  });
}

function openRupaOverlay() {
  if (!overlay) return;
  overlay.classList.remove("is-hidden");
  if (state.step === "idle") {
    buildInitialInputsStep();
  }
}

function closeRupaOverlay() {
  if (!overlay) return;
  overlay.classList.add("is-hidden");
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    openRupaOverlay();
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    closeRupaOverlay();
  });
}

function handleFreeChatSend() {
  const text = (freeChatInput && freeChatInput.value ? freeChatInput.value : "").trim();
  if (!text) return;
  addUserMessage(text);
  if (freeChatInput) {
    freeChatInput.value = "";
  }
}

if (freeChatSendBtn) {
  freeChatSendBtn.addEventListener("click", handleFreeChatSend);
}
if (freeChatInput) {
  freeChatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFreeChatSend();
    }
  });
}

