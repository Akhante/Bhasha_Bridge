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
      gate: item.gate, // 'understand', 'express', or 'apply'
      result: item.result, // 'pass' or 'fail'
      confidence: item.confidence, // 'high' (online) or 'low' (offline)
      source: item.source, // 'online' or 'offline'
      misconception: item.misconception || null,
      ts: item.ts || Date.now(),
    });
    localStorage.setItem("bb_evidence_" + childId, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save evidence to localStorage:", e);
  }
}

// Helper to clear evidence if needed during testing/demos
function clearEvidence(childId) {
  try {
    localStorage.removeItem("bb_evidence_" + childId);
  } catch (e) {
    console.error("Failed to clear evidence:", e);
  }
}

function loadEvidence(childId) {
  return JSON.parse(localStorage.getItem("bb_evidence_" + childId) || "[]");
}
function saveEvidence(childId, item) {
  const all = loadEvidence(childId);
  all.push(item);
  localStorage.setItem("bb_evidence_" + childId, JSON.stringify(all));
}
