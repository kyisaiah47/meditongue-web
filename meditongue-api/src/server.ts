import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { translateWithOllama } from "./translate-ollama";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const TranslateSchema = z.object({
	fromLang: z.string().min(2),
	toLang: z.string().min(2),
	text: z.string().min(1),
});

app.post("/translate", async (req, res) => {
	const parsed = TranslateSchema.safeParse(req.body);
	if (!parsed.success)
		return res.status(400).json({ error: parsed.error.format() });

	try {
		const result = await translateWithOllama(
			parsed.data.fromLang,
			parsed.data.toLang,
			parsed.data.text
		);
		res.json(result);
	} catch (e: any) {
		console.error(e);
		res.status(500).json({ error: e.message || "Translation error" });
	}
});

const port = process.env.PORT || 4000;
app.listen(port, () =>
	console.log(`meditongue-api running on http://localhost:${port}`)
);
