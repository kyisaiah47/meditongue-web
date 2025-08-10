export async function translateWithOllama(
	fromLang: string,
	toLang: string,
	text: string
) {
	const prompt = `Translate the following text from ${fromLang} to ${toLang} using correct medical terminology. Output ONLY the translated text:\n\n${text}`;

	const response = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: "llama3.1", // dev model; we'll swap to gpt-oss later
			prompt,
			stream: false,
		}),
	});

	if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
	const data = await response.json();
	return { translated: (data as any).response?.trim() || "" };
}
