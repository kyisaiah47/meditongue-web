import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { adapter } from "./adapter";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const TranslateSchema = z.object({
	fromLang: z.string().min(2),
	toLang: z.string().min(2),
	text: z.string().min(1),
});

app.get("/health", (_, res) => {
	res.json({ backend: process.env.MODEL_BACKEND || "ollama", ok: true });
});

app.post("/translate", async (req, res) => {
	const parsed = TranslateSchema.safeParse(req.body);
	if (!parsed.success)
		return res.status(400).json({ error: parsed.error.format() });
	try {
		const { fromLang, toLang, text } = parsed.data;
		const result = await adapter.translate(fromLang, toLang, text);
		res.json(result);
	} catch (e: any) {
		console.error(e);
		res.status(500).json({ error: e.message || "Translation error" });
	}
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
	console.log(
		`meditongue-api on http://localhost:${port} (backend=${process.env.MODEL_BACKEND})`
	)
);
