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
	fromLang: z.string(),
	toLang: z.string(),
	text: z.string().min(1),
});

app.post("/translate", async (req, res) => {
	const parse = TranslateSchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ error: parse.error.format() });
	}
	const { fromLang, toLang, text } = parse.data;
	try {
		const result = await translateWithOllama(fromLang, toLang, text);
		res.json(result);
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: err.message || "Translation error" });
	}
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
	console.log(`MediTongue API running on http://localhost:${port}`);
});
