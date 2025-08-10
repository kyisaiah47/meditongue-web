"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Settings } from "lucide-react";
import { toast } from "sonner";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

type Term = { source: string; target: string; note?: string };
type Health = {
	backend: string;
	ok: boolean;
	model?: string;
	baseUrl?: string;
} | null;

const LANGS = [
	{ code: "en", label: "🇺🇸 English" },
	{ code: "es", label: "🇪🇸 Spanish" },
	{ code: "ar", label: "🇦🇪 Arabic" },
	{ code: "fr", label: "🇫🇷 French" },
	{ code: "zh", label: "🇨🇳 Chinese (Simplified)" },
];

// quick phrasebook: add more pairs as needed
const PHRASEBOOK: Record<string, string[]> = {
	"en->es": [
		"I have chest pain.",
		"I am short of breath.",
		"I am allergic to penicillin.",
		"I am pregnant.",
		"Where is the pain located?",
	],
	"es->en": [
		"Tengo dolor en el pecho.",
		"Me falta el aire.",
		"Soy alérgico a la penicilina.",
		"Estoy embarazada.",
		"¿Dónde está el dolor?",
	],
	"en->ar": [
		"I have chest pain.",
		"I am short of breath.",
		"I am allergic to penicillin.",
		"I am pregnant.",
		"Where is the pain located?",
	],
	"ar->en": [
		"عندي ألم في الصدر.",
		"أشعر بضيق في التنفس.",
		"أنا لدي حساسية من البنسلين.",
		"أنا حامل.",
		"أين يقع الألم؟",
	],
};

// ultra‑light language guesser for demo warnings
function guessLang(s: string): "ar" | "zh" | "es" | "fr" | "en" | null {
	const t = s.trim();
	if (!t) return null;
	if (/[\u0600-\u06FF]/.test(t)) return "ar";
	if (/[\u4E00-\u9FFF]/.test(t)) return "zh";
	// crude Spanish/French hints
	if (/\b(el|la|los|las|de|y|pero|porque)\b/i.test(t)) return "es";
	if (/\b(le|la|les|des|et|mais|parce que)\b/i.test(t)) return "fr";
	return "en";
}

export default function Home() {
	const [leftLang, setLeftLang] = useState("en");
	const [rightLang, setRightLang] = useState("es");
	const [leftText, setLeftText] = useState("");
	const [rightText, setRightText] = useState("");
	const [leftTerms, setLeftTerms] = useState<Term[]>([]);
	const [rightTerms, setRightTerms] = useState<Term[]>([]);
	const [leftFlags, setLeftFlags] = useState<string[]>([]);
	const [rightFlags, setRightFlags] = useState<string[]>([]);
	const [busy, setBusy] = useState(false);

	// settings / health
	const [health, setHealth] = useState<Health>(null);
	const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
	const sameLang = useMemo(() => leftLang === rightLang, [leftLang, rightLang]);

	const isEmergency = useMemo(
		() => leftFlags.includes("EMERGENCY") || rightFlags.includes("EMERGENCY"),
		[leftFlags, rightFlags]
	);

	async function fetchHealth() {
		try {
			const r = await fetch("http://localhost:4000/health");
			const j = await r.json();
			setHealth({
				backend: j.backend ?? "unknown",
				ok: !!j.ok,
				model: j.model,
				baseUrl: j.baseUrl,
			});
		} catch {
			setHealth({ backend: "unknown", ok: false });
		}
	}

	useEffect(() => {
		fetchHealth();
	}, []);

	useEffect(() => {
		if (isEmergency)
			toast.error("🚨 EMERGENCY flagged: Consider urgent evaluation.");
	}, [isEmergency]);

	const swap = () => {
		if (sameLang) return;
		setLeftLang(rightLang);
		setRightLang(leftLang);
		setLeftText(rightText);
		setRightText(leftText);
		setLeftTerms(rightTerms);
		setRightTerms(leftTerms);
		setLeftFlags(rightFlags);
		setRightFlags(leftFlags);
	};

	async function copyLeft() {
		await navigator.clipboard.writeText(leftText);
		toast.success("Copied left pane text.");
	}

	async function copyRight() {
		await navigator.clipboard.writeText(rightText);
		toast.success("Copied right pane text.");
	}

	function warnIfLangMismatch(text: string, selected: string) {
		const g = guessLang(text);
		if (g && g !== selected) {
			toast("Language mismatch?", {
				description: `Detected ${g.toUpperCase()} but source is ${selected.toUpperCase()}`,
			});
		}
	}

	async function translateLeftToRight() {
		warnIfLangMismatch(leftText, leftLang);
		setBusy(true);
		const t0 = performance.now();
		try {
			const res = await fetch("http://localhost:4000/translate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fromLang: leftLang,
					toLang: rightLang,
					text: leftText,
				}),
			});
			const data = await res.json();
			setRightText(data.translated || "");
			setRightTerms(Array.isArray(data.terms) ? data.terms : []);
			setRightFlags(Array.isArray(data.flags) ? data.flags : []);
		} catch (err) {
			console.error(err);
			setRightText("[Error translating]");
			setRightTerms([]);
			setRightFlags([]);
			toast.error("Translation failed (left → right).");
		} finally {
			const dt = performance.now() - t0;
			setLastLatencyMs(Math.round(dt));
			setBusy(false);
			fetchHealth(); // refresh backend info after a call
		}
	}

	async function translateRightToLeft() {
		warnIfLangMismatch(rightText, rightLang);
		setBusy(true);
		const t0 = performance.now();
		try {
			const res = await fetch("http://localhost:4000/translate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fromLang: rightLang,
					toLang: leftLang,
					text: rightText,
				}),
			});
			const data = await res.json();
			setLeftText(data.translated || "");
			setLeftTerms(Array.isArray(data.terms) ? data.terms : []);
			setLeftFlags(Array.isArray(data.flags) ? data.flags : []);
		} catch (err) {
			console.error(err);
			setLeftText("[Error translating]");
			setLeftTerms([]);
			setLeftFlags([]);
			toast.error("Translation failed (right → left).");
		} finally {
			const dt = performance.now() - t0;
			setLastLatencyMs(Math.round(dt));
			setBusy(false);
			fetchHealth();
		}
	}

	const phraseKey = `${leftLang}->${rightLang}`;
	const phrases = PHRASEBOOK[phraseKey] || [];

	return (
		<main className="mx-auto max-w-6xl p-6">
			{/* top bar / status */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm">
				<div>
					<b>meditongue</b> — Offline medical translator (MVP). Not medical
					advice.
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">
						{health?.backend ? `Backend: ${health.backend}` : "Backend: …"}
					</Badge>
					{lastLatencyMs != null && (
						<Badge title="Last request latency">{lastLatencyMs} ms</Badge>
					)}
					<Badge variant={health?.ok ? "default" : "destructive"}>
						{health?.ok ? "API ✓" : "API ✗"}
					</Badge>

					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="sm"
							>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="w-[360px]"
						>
							<SheetHeader>
								<SheetTitle>Settings</SheetTitle>
							</SheetHeader>
							<div className="mt-4 space-y-3 text-sm px-4">
								<div className="flex justify-between">
									<span>Backend</span>
									<span className="font-medium">{health?.backend ?? "—"}</span>
								</div>
								<div className="flex justify-between">
									<span>Model</span>
									<span className="font-medium">{health?.model ?? "—"}</span>
								</div>
								<div className="flex justify-between">
									<span>API Base</span>
									<span
										className="truncate font-medium"
										title={health?.baseUrl || ""}
									>
										{health?.baseUrl ?? "—"}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Last Latency</span>
									<span className="font-medium">
										{lastLatencyMs != null ? `${lastLatencyMs} ms` : "—"}
									</span>
								</div>
								<Separator className="my-2" />
								<Button
									size="sm"
									onClick={fetchHealth}
								>
									Refresh
								</Button>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>

			{isEmergency && (
				<div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500 bg-red-100 p-3 text-sm text-red-900 shadow-sm">
					<span className="text-lg">🚨</span>
					<div>
						<b>EMERGENCY FLAGGED:</b> Consider urgent evaluation (e.g., chest
						pain, severe breathing issues).
					</div>
				</div>
			)}

			{/* language controls */}
			<div className="mb-4 flex items-center gap-3">
				<LangSelect
					label="Left"
					value={leftLang}
					onChange={setLeftLang}
				/>
				<Button
					variant={sameLang ? "secondary" : "outline"}
					onClick={swap}
					title={sameLang ? "Languages are identical" : "Swap languages"}
					disabled={sameLang}
				>
					<ArrowLeftRight className="mr-2 h-4 w-4" />
					Swap
				</Button>
				<LangSelect
					label="Right"
					value={rightLang}
					onChange={setRightLang}
				/>
			</div>

			{/* Emergency Phrasebook */}
			{phrases.length > 0 && (
				<div className="mb-4 flex gap-2 overflow-x-auto pb-2">
					{phrases.map((p, i) => (
						<Button
							key={i}
							size="sm"
							variant="secondary"
							className="flex-shrink-0 shadow-sm"
							onClick={() => setLeftText(p)}
						>
							{p}
						</Button>
					))}
				</div>
			)}

			{/* two-pane layout */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="p-4">
					<h2 className="text-sm font-medium">
						Doctor / Side A — {LANGS.find((l) => l.code === leftLang)?.label}
					</h2>
					<Separator className="my-3" />
					<Label
						htmlFor="leftArea"
						className="mb-2 block text-xs"
					>
						Input
					</Label>
					<Textarea
						id="leftArea"
						placeholder="Type here…"
						className="min-h-[160px]"
						value={leftText}
						onChange={(e) => setLeftText(e.target.value)}
					/>
					<div className="mt-3 flex gap-2">
						<Button
							variant={leftLang === rightLang ? "secondary" : "default"}
							onClick={translateLeftToRight}
							title={
								leftLang === rightLang ? "Languages are identical" : "Translate"
							}
							disabled={busy || !leftText.trim() || leftLang === rightLang}
						>
							{busy ? "Translating…" : "Translate →"}
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setLeftText("");
								setLeftTerms([]);
								setLeftFlags([]);
							}}
						>
							Clear
						</Button>
						<Button
							variant="secondary"
							onClick={async () => {
								await navigator.clipboard.writeText(leftText);
								toast.success("Copied left pane text.");
							}}
							disabled={!leftText.trim()}
						>
							Copy
						</Button>
					</div>

					{leftTerms.length > 0 && (
						<div className="mt-3 text-xs">
							<div className="mb-1 font-medium">Terms</div>
							<div className="flex flex-wrap gap-2 bg-muted p-2 rounded-lg">
								{leftTerms.map((t, i) => (
									<span
										key={i}
										className="rounded-full bg-muted px-2 py-1 text-xs shadow-sm"
										title={t.note || ""}
									>
										{t.source} → {t.target}
									</span>
								))}
							</div>
						</div>
					)}
				</Card>

				<Card className="p-4">
					<h2 className="text-sm font-medium">
						Patient / Side B — {LANGS.find((l) => l.code === rightLang)?.label}
					</h2>
					<Separator className="my-3" />
					<Label
						htmlFor="rightArea"
						className="mb-2 block text-xs"
					>
						Input
					</Label>
					<Textarea
						id="rightArea"
						placeholder="Type here…"
						className="min-h-[160px]"
						value={rightText}
						onChange={(e) => setRightText(e.target.value)}
					/>
					<div className="mt-3 flex gap-2">
						<Button
							variant={rightLang === leftLang ? "secondary" : "default"}
							onClick={translateRightToLeft}
							title={
								rightLang === leftLang ? "Languages are identical" : "Translate"
							}
							disabled={busy || !rightText.trim() || rightLang === leftLang}
						>
							{busy ? "Translating…" : "← Translate"}
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setRightText("");
								setRightTerms([]);
								setRightFlags([]);
							}}
						>
							Clear
						</Button>
						<Button
							variant="secondary"
							onClick={async () => {
								await navigator.clipboard.writeText(rightText);
								toast.success("Copied right pane text.");
							}}
							disabled={!rightText.trim()}
						>
							Copy
						</Button>
					</div>

					{rightTerms.length > 0 && (
						<div className="mt-3 text-xs">
							<div className="mb-1 font-medium">Terms</div>
							<div className="flex flex-wrap gap-2">
								{rightTerms.map((t, i) => (
									<span
										key={i}
										className="rounded-full border px-2 py-1"
										title={t.note || ""}
									>
										{t.source} → {t.target}
									</span>
								))}
							</div>
						</div>
					)}
				</Card>
			</div>
		</main>
	);
}

function LangSelect({ label, value, onChange }) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm">{label}</span>
			<Select
				value={value}
				onValueChange={onChange}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Select language" />
				</SelectTrigger>
				<SelectContent>
					{LANGS.map((l) => (
						<SelectItem
							key={l.code}
							value={l.code}
						>
							{l.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
