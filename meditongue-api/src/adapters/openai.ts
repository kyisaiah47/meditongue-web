import { LLMAdapter, TranslateResult } from "./index";
import { getGlossaryPair, matchTermsInText } from "../glossary";

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL || "http://localhost:8000/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "not-needed";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-oss-20b";

async function chat(messages: any[]) {
	const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: OPENAI_MODEL,
			messages,
			temperature: 0.2,
		}),
	});
	if (!r.ok) throw new Error(`OpenAI adapter error ${r.status}`);
	const j = await r.json();
	return j.choices?.[0]?.message?.content ?? "";
}

export const openaiAdapter: LLMAdapter = {
	async translate(fromLang, toLang, text): Promise<TranslateResult> {
		const allTerms = getGlossaryPair(fromLang, toLang);
		const hits = matchTermsInText(text, allTerms);
		const emergency = [
			"chest pain",
			"shortness of breath",
			"stroke",
			"severe bleeding",
			"dolor torácico",
			"dificultad respiratoria",
		];

		const system = `You are MediTongue, an offline medical translator. Output STRICT JSON only:
{"translated": string, "terms":[{"source": string,"target": string,"note": string}], "flags": string[]}`;

		const user = `Translate from ${fromLang} to ${toLang}.
Text: """${text}"""
Glossary: ${hits.map((t) => `${t.source} -> ${t.target}`).join(" | ") || "none"}
If emergency detected (${emergency.join(", ")}), include "EMERGENCY" in flags.
Return ONLY JSON.`;

		const raw = await chat([
			{ role: "system", content: system },
			{ role: "user", content: user },
		]);

		let parsed: TranslateResult = { translated: "", terms: [], flags: [] };
		try {
			parsed = JSON.parse(raw);
		} catch {
			parsed.translated = raw;
		}
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
