import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
	| string
	| undefined;

const isBrowser = typeof window !== "undefined";

if (isBrowser && (!supabaseUrl || !supabaseAnonKey)) {
	console.warn(
		"Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY - Supabase calls will fail.",
	);
}

// Fallbacks let the app build/render before real credentials are configured;
// createClient() throws immediately on an empty string.
export const supabase = createClient(
	supabaseUrl || "https://placeholder.supabase.co",
	supabaseAnonKey || "placeholder-anon-key",
	{
		auth: {
			persistSession: isBrowser,
			autoRefreshToken: isBrowser,
		},
	},
);

let anonymousSessionPromise: Promise<void> | null = null;

/** Ensures the visitor has an anonymous Supabase session; safe to call repeatedly. */
export function ensureAnonymousSession(): Promise<void> {
	if (!isBrowser) return Promise.resolve();

	if (!anonymousSessionPromise) {
		anonymousSessionPromise = (async () => {
			const { data } = await supabase.auth.getSession();
			if (data.session) return;

			const { error } = await supabase.auth.signInAnonymously();
			if (error) {
				anonymousSessionPromise = null;
				throw error;
			}
		})();
	}

	return anonymousSessionPromise;
}

/** Returns the current Supabase access token, signing in anonymously first if needed. */
export async function getAccessToken(): Promise<string | null> {
	await ensureAnonymousSession();
	const { data } = await supabase.auth.getSession();
	return data.session?.access_token ?? null;
}
