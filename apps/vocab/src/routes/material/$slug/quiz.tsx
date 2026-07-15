import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PageShell, ProgressBar } from "@/components/PageShell";
import { getQuiz, submitQuiz } from "@/lib/api";
import type { QuizQuestion, QuizSubmitResult } from "@/lib/types";

export const Route = createFileRoute("/material/$slug/quiz")({
	component: QuizPage,
});

function QuizPage() {
	const { slug } = Route.useParams();
	const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [result, setResult] = useState<QuizSubmitResult | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		getQuiz(slug)
			.then(setQuestions)
			.catch((e) => setError(e.message));
	}, [slug]);

	if (error) {
		return (
			<PageShell>
				<PageHeader title="Quiz" backTo={`/material/${slug}`} />
				<p className="text-sm text-red-600">{error}</p>
			</PageShell>
		);
	}

	if (!questions || questions.length === 0) {
		return (
			<PageShell>
				<PageHeader title="Quiz" backTo={`/material/${slug}`} />
				<p className="text-sm text-slate-500">
					{questions ? "No quiz yet." : "Loading…"}
				</p>
			</PageShell>
		);
	}

	if (result) {
		return (
			<PageShell>
				<PageHeader title="Quiz Result" />
				<div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
					<Trophy className="mb-3 h-14 w-14 text-amber-400" />
					<div className="mb-1 text-base font-semibold text-slate-900">
						Great Job!
					</div>
					<p className="mb-6 text-sm text-slate-500">You completed the quiz.</p>
					<div className="mb-8 flex w-full gap-3">
						<div className="flex-1 rounded-xl bg-slate-50 py-3">
							<div className="text-lg font-bold text-slate-900">
								{result.score} / {result.total}
							</div>
							<div className="text-xs text-slate-500">Score</div>
						</div>
						<div className="flex-1 rounded-xl bg-slate-50 py-3">
							<div className="text-lg font-bold text-slate-900">
								{result.accuracy}%
							</div>
							<div className="text-xs text-slate-500">Accuracy</div>
						</div>
					</div>
					<Link
						to="/material/$slug"
						params={{ slug }}
						className="mb-3 block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white"
					>
						Back to Discourse
					</Link>
					<Link to="/" className="text-sm font-medium text-slate-500">
						Back to Home
					</Link>
				</div>
			</PageShell>
		);
	}

	const question = questions[index];
	const selected = answers[question.id];
	const isLast = index === questions.length - 1;

	async function selectOption(optionId: string) {
		const nextAnswers = { ...answers, [question.id]: optionId };
		setAnswers(nextAnswers);

		if (isLast) {
			setSubmitting(true);
			try {
				const submitResult = await submitQuiz(
					slug,
					Object.entries(nextAnswers).map(([questionId, optionId]) => ({
						questionId,
						optionId,
					})),
				);
				setResult(submitResult);
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setSubmitting(false);
			}
		} else {
			setIndex((i) => i + 1);
		}
	}

	return (
		<PageShell>
			<PageHeader title="Quiz" backTo={`/material/${slug}`} />

			<div className="mb-4">
				<div className="mb-1 text-xs text-slate-500">
					Question {index + 1} of {questions.length}
				</div>
				<ProgressBar value={index + 1} max={questions.length} />
			</div>

			<div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5">
				<p className="text-sm font-semibold text-slate-900">
					{question.prompt}
				</p>
			</div>

			<div className="space-y-2">
				{question.options.map((option) => (
					<button
						key={option.id}
						type="button"
						disabled={submitting}
						onClick={() => selectOption(option.id)}
						className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium disabled:opacity-50 ${
							selected === option.id
								? "border-blue-600 bg-blue-50 text-blue-700"
								: "border-slate-200 bg-white text-slate-700"
						}`}
					>
						{option.text}
					</button>
				))}
			</div>
		</PageShell>
	);
}
