import { Button } from "@feedbase/ui";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div>
			<h1>Hehehehehe</h1>
			<Button label="Click me" />
		</div>
	);
}
