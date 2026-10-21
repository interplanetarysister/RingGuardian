// Ring Guardian Cam — video/scanner timestamp synchronization engine.
//
// This module is the single source of truth for correlating a scanner event with a
// recording. It is pure and deterministic: given the same event and clip catalogue it
// always returns the same result, which is what makes the demonstration repeatable.
//
// It is deliberately conservative. It never asserts that a package was stolen, never
// attributes misconduct to a person, and never promotes a camera observation into an
// official scan.

export const SYNC_STATUS = {
  MATCHED: "matched",
  MISSING: "missing_footage",
  AMBIGUOUS: "ambiguous",
  WRONG_CAMERA: "incorrect_camera",
  DELAYED: "delayed",
  PENDING: "pending",
  REJECTED: "rejected"
};

export const SYNC_LABELS = {
  matched: "Matched",
  missing_footage: "Missing footage",
  ambiguous: "Ambiguous match",
  incorrect_camera: "Incorrect camera assignment",
  delayed: "Delayed synchronization",
  pending: "Pending processing",
  rejected: "Match rejected by investigator"
};

export const SYNC_TONES = {
  matched: "ok",
  missing_footage: "danger",
  ambiguous: "warn",
  incorrect_camera: "danger",
  delayed: "warn",
  pending: "muted",
  rejected: "warn"
};

export const TELEMETRY_SOURCE = "Vehicle / terminal telemetry (simulated)";

function secondsBetween(fromIso, toIso) {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 1000);
}

function coveredBy(clip, iso) {
  const t = new Date(iso).getTime();
  return t >= new Date(clip.recorded_start).getTime() && t <= new Date(clip.recorded_end).getTime();
}

/**
 * Correlate one scan event against the recording catalogue.
 *
 * @param event    the ScanEvent record
 * @param clips    VideoClip records for the demo session
 * @param scanners Scanner records for the demo session
 * @param cameras  GuardianCamera records for the demo session
 */
export function synchronizeEvent(event, clips = [], scanners = [], cameras = []) {
  const scanner = scanners.find((s) => s.device_id === event.scanner_id);

  // 1. Events produced by vehicles, terminals or customer reports carry no wearable
  //    capture. They are not failures and must not be reported as missing evidence.
  if (!event.camera_id) {
    return {
      sync_status: SYNC_STATUS.MATCHED,
      sync_note: "Telemetry-only event — no wearable capture required.",
      video_clip_key: "",
      playback_position_seconds: 0,
      evidence_source: event.note && event.note.indexOf("Package P.I.") >= 0
        ? "Customer report (Package P.I. submission)"
        : TELEMETRY_SOURCE,
      candidates: [],
      rejected: []
    };
  }

  // 2. A scan that cannot be bound to a work session can never be bound to a
  //    recording. This is reported as a camera assignment problem, not as missing media.
  if (scanner && scanner.assignment_mismatch) {
    return {
      sync_status: SYNC_STATUS.WRONG_CAMERA,
      sync_note:
        "Scanner " + scanner.device_id +
        " is not bound to a work session and has no paired Guardian camera, so this scan cannot be attributed to a wearable recording.",
      video_clip_key: "",
      playback_position_seconds: 0,
      evidence_source: "Unattributable — scanner not provisioned",
      candidates: [],
      rejected: []
    };
  }

  // Only compare against an assigned vest camera when the event names an employee.
  // Shared or fixed cameras (a doorbell, a dock camera) belong to no employee, so an
  // empty employee id must never be matched against an unstaffed camera record.
  const assigned = event.employee_id
    ? cameras.find((c) => c.assigned_employee_id === event.employee_id)
    : null;
  if (assigned && event.camera_id && assigned.device_id !== event.camera_id) {
    return {
      sync_status: SYNC_STATUS.WRONG_CAMERA,
      sync_note:
        "Scan attributed to " + event.camera_id + ", but the assigned vest camera for this employee is " +
        assigned.device_id + ". Footage has been requested from the assigned device.",
      video_clip_key: "",
      playback_position_seconds: 0,
      evidence_source: "Incorrect device attribution",
      candidates: [],
      rejected: []
    };
  }

  // 3. A dropped or failed scanner connection defers synchronization rather than
  //    losing it — the association is completed when the device reconciles.
  if (scanner && (scanner.connection_status === "disconnected" || scanner.connection_status === "error")) {
    return {
      sync_status: SYNC_STATUS.DELAYED,
      sync_note:
        "Scanner " + scanner.device_id + " reported " + scanner.connection_status +
        ". The association is queued and will be completed when the device reconciles its session log.",
      video_clip_key: "",
      playback_position_seconds: 0,
      evidence_source: "Queued — device reconciliation pending",
      candidates: [],
      rejected: []
    };
  }

  // 4. Candidate search: same camera, capture window covering the event timestamp.
  const candidates = clips.filter((c) => c.camera_id === event.camera_id && c.recorded_start && c.recorded_end && coveredBy(c, event.occurred_at));

  // 5. Rejections are recorded explicitly so an investigator can see why a nearby
  //    recording was not used.
  const rejected = clips
    .filter((c) => c.camera_id !== event.camera_id && c.recorded_start && c.recorded_end && coveredBy(c, event.occurred_at))
    .map((c) => ({ clip_key: c.clip_key, reason: "Captured on " + c.camera_id + ", not the camera bound to this event." }));

  if (candidates.length === 0) {
    return {
      sync_status: SYNC_STATUS.MISSING,
      sync_note:
        "No recording covers " + event.occurred_at + " on " + event.camera_id +
        ". Retention, power state and duty cycle were all checked.",
      video_clip_key: "",
      playback_position_seconds: 0,
      evidence_source: "No capture available",
      candidates: [],
      rejected
    };
  }

  if (candidates.length > 1) {
    const keys = candidates.map((c) => c.clip_key).join(", ");
    return {
      sync_status: SYNC_STATUS.AMBIGUOUS,
      sync_note:
        candidates.length + " capture windows overlap this timestamp (" + keys +
        "). An investigator must select the recording to use.",
      video_clip_key: candidates[0].clip_key,
      playback_position_seconds: Math.max(0, secondsBetween(candidates[0].recorded_start, event.occurred_at)),
      evidence_source: "Multiple candidate recordings",
      candidates: candidates.map((c) => c.clip_key),
      rejected
    };
  }

  const clip = candidates[0];
  const offset = Math.max(0, secondsBetween(clip.recorded_start, event.occurred_at));
  const unconfirmed = event.scan_status === "unconfirmed" || event.scan_status === "missed" || event.scan_status === "failed";

  return {
    sync_status: SYNC_STATUS.MATCHED,
    sync_note: unconfirmed
      ? "Recording located and synchronized, but this handling event has no confirmed terminal scan. The recording documents handling only and does not create an official scan."
      : "Recording " + clip.clip_key + " matched at offset " + offset + "s of a " + (clip.duration_seconds || 14) + "s capture window.",
    video_clip_key: clip.clip_key,
    playback_position_seconds: offset,
    evidence_source: clip.source_label || "Generated scene reconstruction",
    candidates: [clip.clip_key],
    rejected
  };
}

export function formatOffset(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return "+" + s + "s";
}

export function playbackClock(clip, positionSeconds) {
  if (!clip || !clip.recorded_start) return "--:--:--";
  const d = new Date(new Date(clip.recorded_start).getTime() + Math.max(0, positionSeconds || 0) * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}