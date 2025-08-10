import { LLMAdapter, TranslateResult } from "./index";
import { getGlossaryPair, matchTermsInText } from "../glossary";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

export const ollamaAdapter: LLMAdapter = {
	async translate(fromLang, toLang, text): Promise<TranslateResult> {
		const allTerms = getGlossaryPair(fromLang, toLang);
		const hits = matchTermsInText(text, allTerms);

		const system = `
You are MediTongue, an offline medical translator. Output strict JSON:
{"translated": string, "terms":[{"source": string,"target": string,"note": string}], "flags": string[]}
`.trim();

		const emergency = [
			"chest pain",
			"shortness of breath",
			"stroke",
			"severe bleeding",
			"dolor torácico",
			"dificultad respiratoria",
		];

		const user = `
Translate from ${fromLang} to ${toLang}.
Text: """${text}"""
Glossary: ${hits.map((t) => `${t.source} -> ${t.target}`).join(" | ") || "none"}
If emergency detected (${emergency.join(", ")}), include "EMERGENCY" in flags.
Return ONLY JSON.
`.trim();

		const prompt = `${system}\n\n${user}`;

		const r = await fetch(`${OLLAMA_URL}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
		});
		if (!r.ok) throw new Error(`Ollama error ${r.status}`);
		const data = await r.json();
		const raw = (data as any).response?.trim() || "";

		let parsed: TranslateResult = { translated: "", terms: [], flags: [] };
		try {
			parsed = JSON.parse(raw);
		} catch {
			parsed.translated = raw;
		}
		// ensure glossary hits present
		for (const t of hits)
			if (
				!parsed.terms.some(
					(x) => x.source?.toLowerCase() === t.source.toLowerCase()
				)
			)
				parsed.terms.push(t);
		parsed.flags = Array.isArray(parsed.flags) ? parsed.flags : [];
		parsed.translated = String(parsed.translated || "").trim();
		return parsed;
	},
};
