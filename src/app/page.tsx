"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

// shadcn Select components
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Term = { source: string; target: string; note?: string };

const LANGS = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Spanish" },
	{ code: "ar", label: "Arabic" },
	{ code: "fr", label: "French" },
	{ code: "zh", label: "Chinese (Simplified)" },
];

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

	const isEmergency = useMemo(
		() => leftFlags.includes("EMERGENCY") || rightFlags.includes("EMERGENCY"),
		[leftFlags, rightFlags]
	);

	const swap = () => {
		setLeftLang(rightLang);
		setRightLang(leftLang);
		setLeftText(rightText);
		setRightText(leftText);
		setLeftTerms(rightTerms);
		setRightTerms(leftTerms);
		setLeftFlags(rightFlags);
		setRightFlags(leftFlags);
	};

	useEffect(() => {
		if (isEmergency) {
			toast.error("🚨 EMERGENCY flagged: Consider urgent evaluation.");
		}
	}, [isEmergency]);

	async function copyLeft() {
		await navigator.clipboard.writeText(leftText);
		toast("Copied left pane text.");
	}

	async function copyRight() {
		await navigator.clipboard.writeText(rightText);
		toast("Copied right pane text.");
	}

	async function translateLeftToRight() {
		setBusy(true);
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
		} finally {
			setBusy(false);
		}
	}

	async function translateRightToLeft() {
		setBusy(true);
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
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="mx-auto max-w-6xl p-6">
			<div className="mb-4 rounded-xl border p-3 text-sm">
				<b>meditongue</b> — Offline medical translator (MVP). Not medical
				advice.
			</div>

			{isEmergency && (
				<div className="mb-4 rounded-xl border border-red-500 bg-red-50 p-3 text-sm text-red-800">
					<b>EMERGENCY FLAGGED:</b> Consider urgent evaluation (e.g., chest
					pain, severe breathing issues).
				</div>
			)}

			<div className="mb-4 flex items-center gap-3">
				<LangSelect
					label="Left"
					value={leftLang}
					onChange={setLeftLang}
				/>
				<Button
					variant="outline"
					onClick={swap}
					title="Swap languages"
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

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="p-4">
					<h2 className="text-sm font-medium">Doctor / Side A ({leftLang})</h2>
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
							onClick={translateLeftToRight}
							disabled={busy || !leftText.trim()}
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
							onClick={copyLeft}
							disabled={!leftText.trim()}
						>
							Copy
						</Button>
					</div>
					{leftTerms.length > 0 && (
						<div className="mt-3 text-xs">
							<div className="mb-1 font-medium">Terms</div>
							<div className="flex flex-wrap gap-2">
								{leftTerms.map((t, i) => (
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

				<Card className="p-4">
					<h2 className="text-sm font-medium">
						Patient / Side B ({rightLang})
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
							onClick={translateRightToLeft}
							disabled={busy || !rightText.trim()}
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
							onClick={copyRight}
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

function LangSelect({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
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
