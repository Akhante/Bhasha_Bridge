const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pack = JSON.parse(fs.readFileSync(path.join(root, "public/pack.json"), "utf8"));
const text = [
	pack.pulse.strong.apply.ml,
	pack.pulse.support.express.ml,
	pack.dinner_questions.evap_rate.ml,
].join(" ");
const baseUrl = (process.env.BHASHABRIDGE_URL || "http://localhost:3000").replace(/\/$/, "");

async function main() {
	const response = await fetch(`${baseUrl}/api/tts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ text }),
	});
	if (!response.ok) throw new Error(`TTS endpoint returned HTTP ${response.status}`);
	const data = await response.json();
	if (!data.audioBase64) throw new Error(data.error || "TTS returned no audio");

	const output = path.join(root, "public/audio/pulse_demo.wav");
	fs.mkdirSync(path.dirname(output), { recursive: true });
	fs.writeFileSync(output, Buffer.from(data.audioBase64, "base64"));
	console.log(`Wrote demo backup audio: ${output}`);
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
