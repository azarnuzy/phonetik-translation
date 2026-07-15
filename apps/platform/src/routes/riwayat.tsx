import { createFileRoute } from "@tanstack/react-router";
import { ConversionList } from "@/components/ConversionList";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/riwayat")({ component: RiwayatPage });

function RiwayatPage() {
	return (
		<Layout>
			<div className="space-y-5">
				<div>
					<h1 className="text-xl font-bold text-slate-900">Riwayat</h1>
					<p className="mt-1 text-sm text-slate-500">
						Semua paragraf yang pernah kamu konversi ke fonetik.
					</p>
				</div>
				<ConversionList
					onlyFavorites={false}
					emptyTitle="Belum ada riwayat"
					emptySubtitle="Hasil konversi kamu akan muncul di sini."
				/>
			</div>
		</Layout>
	);
}
