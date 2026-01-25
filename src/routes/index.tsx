import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
  beforeLoad: () => {
    throw redirect({ to: "/customers" });
  },
});

function App() {
  return <p>dashboard</p>;
}
