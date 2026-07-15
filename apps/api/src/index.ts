import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { discourses } from "./routes/discourses";
import { me } from "./routes/me";
import { quiz } from "./routes/quiz";
import { words } from "./routes/words";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.text("Hello Hono!"));

app.route("/discourses", discourses);
app.route("/words", words);
app.route("/", quiz);
app.route("/me", me);

serve(
	{
		fetch: app.fetch,
		port: 8000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
