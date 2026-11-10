function gateState(evidence, conceptId, gate) {
  let pass = 0,
    fail = 0,
    n = 0;

  for (const e of evidence) {
    if (e.concept !== conceptId || e.gate !== gate) continue;
    // Offline evidence counts as half weight to reflect lower confidence
    const w = e.confidence === "low" ? 0.5 : 1;
    if (e.result === "pass") {
      pass += w;
    } else {
      fail += w;
    }
    n++;
  }

  // Simple Beta-style estimate smoothing (Laplace smoothing)
  const estimate = (pass + 1) / (pass + fail + 2);

  let label = "not enough evidence yet";
  if (n >= 3) {
    if (estimate >= 0.7) {
      label = "strong";
    } else if (estimate >= 0.45) {
      label = "developing";
    } else {
      label = "needs support";
    }
  }

  return { n, estimate, label };
}

function nextActivity(evidence, conceptId) {
  const actions = {
    understand: "Try a new everyday example and predict what happens",
    express: "Learn the Malayalam-English word pairs, then answer in English",
    apply: "Try a new situation with fewer hints",
  };

  let weakest = "understand";
  let lowest = 2; // Higher than max possible estimate (1.0)

  for (const g of ["understand", "express", "apply"]) {
    const s = gateState(evidence, conceptId, g);
    if (s.estimate < lowest) {
      lowest = s.estimate;
      weakest = g;
    }
  }

  return {
    gate: weakest,
    text: actions[weakest],
  };
}
