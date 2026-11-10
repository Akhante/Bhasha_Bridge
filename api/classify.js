module.exports = async function handler(req, res) {
  const { conceptId, answerText, labels, correctDescription } = req.body;
  const list = labels.map(l => l.id + ': ' + l.description).join(' | ');

  const prompt = `You classify a Class 7 student's answer about ${conceptId}.
Correct understanding for this concept is defined as: ${correctDescription || 'Correct science understanding.'}

The answer may be in Malayalam, English or mixed.
Choose exactly ONE label from this list: ${list} | correct: the answer shows correct understanding | unclear: you cannot tell | other: a wrong idea that is not in the list.
Never invent a label. If unsure, use unclear.
Return ONLY JSON like {"label": "...", "confidence": 0.0 to 1.0, "evidence_phrase": "exact words from the answer that support the label", "needs_followup": true or false}.
Set needs_followup to true if confidence is below 0.6 or the label is unclear.
Student answer: ${answerText}`;
  try {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + process.env.GEMINI_MODEL + ':generateContent',
      { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0 } }) });
    const data = await r.json();
    res.status(200).json(JSON.parse(data.candidates[0].content.parts[0].text));
  } catch (e) {
    res.status(200).json({ label: 'unclear', confidence: 0, evidence_phrase: '', needs_followup: true });
  }
};