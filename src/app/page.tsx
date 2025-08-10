"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftRight } from "lucide-react";

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
	const [busy, setBusy] = useState(false);

	const swap = () => {
		setLeftLang(rightLang);
		setRightLang(leftLang);
		setLeftText(rightText);
		setRightText(leftText);
	};

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
		} catch (err) {
			console.error(err);
			setRightText("[Error translating]");
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
		} catch (err) {
			console.error(err);
			setLeftText("[Error translating]");
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="mx-auto max-w-6xl p-6">
			{/* top bar / disclaimer */}
			<div className="mb-4 rounded-xl border p-3 text-sm">
				<b>MediTongue</b> — Offline medical translator (MVP). Not medical
				advice.
			</div>

			{/* language controls */}
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

			{/* two-pane layout */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="p-4">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-medium">
							Doctor / Side A ({leftLang})
						</h2>
					</div>
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
							Translate →
						</Button>
						<Button
							variant="outline"
							onClick={() => setLeftText("")}
						>
							Clear
						</Button>
					</div>
				</Card>

				<Card className="p-4">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-medium">
							Patient / Side B ({rightLang})
						</h2>
					</div>
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
							← Translate
						</Button>
						<Button
							variant="outline"
							onClick={() => setRightText("")}
						>
							Clear
						</Button>
					</div>
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
			<select
				className="rounded-md border bg-background p-2 text-sm"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			>
				{LANGS.map((l) => (
					<option
						key={l.code}
						value={l.code}
					>
						{l.label}
					</option>
				))}
			</select>
		</div>
	);
}
