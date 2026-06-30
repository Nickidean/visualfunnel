import ShareView from "@/components/ShareView";

// Public read-only share page. Rendered on demand (the journey is fetched
// client-side), so it isn't prerendered at build time.
export const dynamic = "force-dynamic";

export default function SharePage({ params }) {
  return <ShareView id={params.id} />;
}
