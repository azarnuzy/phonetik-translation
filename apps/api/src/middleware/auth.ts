import type { Context, Next } from "hono";
import { jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

async function verifyBearer(c: Context): Promise<string | null> {
	const header = c.req.header("Authorization");
	if (!header?.startsWith("Bearer ")) return null;

	const token = header.slice("Bearer ".length);
	try {
		const { payload } = await jwtVerify(token, secret());
		return typeof payload.sub === "string" ? payload.sub : null;
	} catch {
		return null;
	}
}

/** Attaches c.var.userId when a valid Supabase JWT is present; does not require one. */
export async function optionalAuth(c: Context, next: Next) {
	c.set("userId", await verifyBearer(c));
	await next();
}

/** Requires a valid Supabase JWT (silent/anonymous login still produces one). */
export async function requireAuth(c: Context, next: Next) {
	const userId = await verifyBearer(c);
	if (!userId) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	c.set("userId", userId);
	await next();
}
