function loadEvidence(childId) {
  try {
    const data = localStorage.getItem("bb_evidence_" + childId);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load evidence from localStorage:", e);
    return [];
  }
}

function saveEvidence(childId, item) {
  try {
    const all = loadEvidence(childId);
    all.push({
      concept: item.concept,
      gate: item.gate,
      result: item.result,
      confidence: item.confidence,
      source: item.source,
      misconception: item.misconception || null,
      ts: item.ts || Date.now(),
    });
    localStorage.setItem("bb_evidence_" + childId, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save evidence to localStorage:", e);
  }
}

function clearEvidence(childId) {
  try {
    localStorage.removeItem("bb_evidence_" + childId);
  } catch (e) {
    console.error("Failed to clear evidence:", e);
  }
}
