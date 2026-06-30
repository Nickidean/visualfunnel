"use client";

import { useEffect, useState } from "react";
import PresentMode from "./PresentMode";
import { getSharedJourney } from "@/lib/journeys";

// Public, read-only view of a shared journey (no sign-in). Opens straight into
// the overview board; viewers can switch device or walk through it.
export default function ShareView({ id }) {
  const [state, setState] = useState({ loading: true, journey: null });
  const [device, setDevice] = useState("desktop");

  useEffect(() => {
    let alive = true;
    getSharedJourney(id)
      .then((j) => alive && setState({ loading: false, journey: j }))
      .catch(() => alive && setState({ loading: false, journey: null }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-sm text-white/50">
        Loading…
      </div>
    );
  }

  if (!state.journey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 text-center text-white/70">
        <div>
          <p className="text-lg font-semibold">This journey isn&apos;t available</p>
          <p className="mt-1 text-sm text-white/50">
            The link may be wrong, or sharing has been turned off.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PresentMode
      journey={state.journey}
      device={device}
      onDeviceChange={setDevice}
      onClose={() => {}}
      shareMode
    />
  );
}
