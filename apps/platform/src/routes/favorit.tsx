import { createFileRoute } from "@tanstack/react-router";
import { ConversionList } from "@/components/ConversionList";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/favorit")({ component: FavoritPage });

function FavoritPage() {
	return (
		<Layout>
			<div className="space-y-5">
				<div>
					<h1 className="text-xl font-bold text-slate-900">Favorit</h1>
					<p className="mt-1 text-sm text-slate-500">
						Paragraf fonetik yang kamu simpan sebagai favorit.
					</p>
				</div>
				<ConversionList
					onlyFavorites={true}
					emptyTitle="Belum ada favorit"
					emptySubtitle="Simpan hasil konversi favoritmu agar mudah ditemukan kembali."
				/>
			</div>
		</Layout>
	);
}
