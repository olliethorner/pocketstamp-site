import { useState } from "react";

export default function ScannerLaunchAction({ devices = [], isLoading, error, onLaunch }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const selectedId = devices.some((device) => device.id === selectedDeviceId)
    ? selectedDeviceId
    : devices.length === 1
      ? devices[0].id
      : "";

  if (isLoading) {
    return <p className="text-sm text-[var(--ps-muted)]">Checking Scanner Mode…</p>;
  }
  if (!devices.length) {
    return (
      <div className="rounded-xl border border-[var(--ps-border)] bg-white/60 px-4 py-3">
        <p className="text-sm font-semibold text-[var(--ps-espresso)]">Scanner Mode isn’t set up yet.</p>
        {error ? <p className="mt-1 text-xs leading-5 text-[var(--ps-muted)]">Refresh to check again.</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {devices.length > 1 ? (
        <label className="block text-xs font-semibold text-[var(--ps-muted)]">
          Choose a scanner
          <select
            value={selectedId}
            onChange={(event) => setSelectedDeviceId(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--ps-border)] bg-white px-3 py-2.5 text-sm text-[var(--ps-espresso)]"
          >
            <option value="">Select a device</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.deviceName}{device.locationName ? ` · ${device.locationName}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-xs text-[var(--ps-muted)]">
          {devices[0].deviceName}{devices[0].locationName ? ` · ${devices[0].locationName}` : ""}
        </p>
      )}
      <button
        type="button"
        disabled={!selectedId}
        onClick={() => onLaunch(selectedId)}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--ps-blue)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#255ddd] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Open Scanner Mode
      </button>
      {error && devices.length ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
