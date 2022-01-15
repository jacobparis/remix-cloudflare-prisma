import { LoaderFunction, redirect } from "remix";

export const loader:LoaderFunction = ({ request }) => {
  // Keep this route as a placeholder for when you want real content on the index
  // Until then, send everyone into the app
  return redirect('/triage')
}

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1> Marketing Landing Page</h1>
    </div>
  );
}
