import { getGlossaryPair, matchTermsInText } from "./glossary";

export async function translateWithOllama(
	fromLang: string,
	toLang: string,
	text: string
) {
	const allTerms = getGlossaryPair(fromLang, toLang);
	const hits = matchTermsInText(text, allTerms);

	const system = `
You are MediTongue, an *offline* medical translator.
- Preserve medical accuracy and dosage/med names.
- Use target-language clinical phrasing when appropriate (e.g., "dolor torácico").
- Do NOT add explanations, only translate.
- Output strict JSON.
JSON schema:
{
  "translated": string,
  "terms": [{"source": string, "target": string, "note": string}],
  "flags": string[] // e.g., ["EMERGENCY"]
}
  `.trim();

	const glossaryContext = hits.length
		? `Glossary hints (use if correct in context): ${hits
				.map((t) => `${t.source} -> ${t.target}`)
				.join(" | ")}`
		: `No glossary hints found.`;

	const emergencyTriggers = [
		"chest pain",
		"dolor torácico",
		"shortness of breath",
		"dificultad respiratoria",
		"severe bleeding",
		"stroke",
		"accidente cerebrovascular",
	];

	const user = `
Translate from ${fromLang} to ${toLang}.
Text: """${text}"""
${glossaryContext}
If text indicates emergency (${emergencyTriggers.join(
		", "
	)}), include "EMERGENCY" in flags.
Return ONLY JSON, no backticks.
  `.trim();

	const prompt = `${system}\n\n${user}`;

	const response = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: "llama3.1", // dev model; swap to gpt-oss later
			prompt,
			stream: false,
		}),
	});

	if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

	const data = await response.json();
	const raw = (data as any).response?.trim() || "";

	// Best-effort JSON parse with fallback
	let parsed: any;
	try {
		parsed = JSON.parse(raw);
	} catch {
		// fallback: wrap as minimal object
		parsed = { translated: raw, terms: [], flags: [] };
	}

	// Ensure terms include our matched glossary hits at least
	if (!Array.isArray(parsed.terms)) parsed.terms = [];
	for (const t of hits) {
		if (
			!parsed.terms.some(
				(x: any) =>
					x.source?.toLowerCase() === t.source.toLowerCase() &&
					x.target?.toLowerCase() === t.target.toLowerCase()
			)
		) {
			parsed.terms.push(t);
		}
	}

	if (!Array.isArray(parsed.flags)) parsed.flags = [];
	return {
		translated: String(parsed.translated || "").trim(),
		terms: parsed.terms,
		flags: parsed.flags,
	};
}
