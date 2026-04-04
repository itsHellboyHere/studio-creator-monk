import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirects traffic into the app. 
  // Your middleware.js will handle authenticating and sorting roles.
  redirect("/clients");
}