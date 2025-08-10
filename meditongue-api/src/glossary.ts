import fs from "fs";
import path from "path";

type Term = { source: string; target: string; note?: string };
type Glossary = Record<string, Term[]>;

const GLOSSARY_PATH = path.join(__dirname, "..", "data", "glossary.json");
const GLOSSARY: Glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, "utf8"));

export function getGlossaryPair(fromLang: string, toLang: string): Term[] {
	return GLOSSARY[`${fromLang}->${toLang}`] || [];
}

export function matchTermsInText(text: string, terms: Term[]): Term[] {
	const lower = text.toLowerCase();
	return terms.filter((t) => lower.includes(t.source.toLowerCase()));
}
