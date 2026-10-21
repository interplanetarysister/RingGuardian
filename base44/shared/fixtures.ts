// Ring Guardian Cam — deterministic demo fixtures.
// All identities, facilities, tracking numbers and events in this file are fictional.
// No real customer data, employee records or Amazon logistics data is represented here.

export const TZ_OFFSET = "-07:00";
export const DAY1 = "2026-10-19";
export const DAY2 = "2026-10-20";
export const DAY3 = "2026-10-21";

export function ts(date, time) {
  return `${date}T${time}${TZ_OFFSET}`;
}

export const FACILITIES = [
  { code: "SEA3", name: "Puget Sound Fulfillment Center", facility_type: "Fulfillment Center", city: "Kent", state: "WA", timezone: "America/Los_Angeles" },
  { code: "PDX1", name: "Columbia Sort Center", facility_type: "Sort Center", city: "Portland", state: "OR", timezone: "America/Los_Angeles" },
  { code: "SFO7", name: "Bay Area Delivery Station", facility_type: "Delivery Station", city: "Oakland", state: "CA", timezone: "America/Los_Angeles" },
  { code: "DEN2", name: "Front Range Sort Center", facility_type: "Sort Center", city: "Denver", state: "CO", timezone: "America/Denver" }
];

export const EMPLOYEES = [
  { employee_id: "EMP-1042", full_name: "Dana Whitfield", initials: "DW", role: "Inbound Associate", badge_id: "B-77104", facility: "SEA3", shift: "A (06:00-14:30)", status: "on_shift", accent_hue: 205 },
  { employee_id: "EMP-2087", full_name: "Marcus Oyelaran", initials: "MO", role: "Sortation Associate", badge_id: "B-81290", facility: "SEA3", shift: "B (14:00-22:30)", status: "on_shift", accent_hue: 168 },
  { employee_id: "EMP-3311", full_name: "Priya Raman", initials: "PR", role: "Sortation Associate", badge_id: "B-64011", facility: "PDX1", shift: "A (06:00-14:30)", status: "on_shift", accent_hue: 264 },
  { employee_id: "EMP-4519", full_name: "Tomas Beck", initials: "TB", role: "Delivery Associate", badge_id: "B-39872", facility: "SFO7", shift: "C (09:00-17:30)", status: "on_shift", accent_hue: 32 },
  { employee_id: "EMP-5620", full_name: "Ellen Nakamura", initials: "EN", role: "Operations Supervisor", badge_id: "B-10088", facility: "SEA3", shift: "B (14:00-22:30)", status: "on_shift", accent_hue: 320 },
  { employee_id: "EMP-6733", full_name: "Jordan Alvarez", initials: "JA", role: "Quality Investigator", badge_id: "B-22951", facility: "PDX1", shift: "A (06:00-14:30)", status: "on_shift", accent_hue: 12 },
  { employee_id: "EMP-7832", full_name: "Nadia Petrov", initials: "NP", role: "Line Haul Driver", badge_id: "B-55420", facility: "SEA3", shift: "B (14:00-22:30)", status: "break", accent_hue: 236 }
];

export const CAMERAS = [
  { device_id: "CAM-2201", model: "Guardian Vest Cam G1 (proposed hardware)", assigned_employee_id: "EMP-1042", facility: "SEA3", mount_position: "Left chest, forward facing", status: "online", battery_pct: 87, firmware: "0.9.4-demo", last_sync_at: ts(DAY2, "09:20:44"), stream_label: "sea3/vest/cam-2201", ring_linked: false, provenance: "proposed_hardware_simulated" },
  { device_id: "CAM-2202", model: "Guardian Vest Cam G1 (proposed hardware)", assigned_employee_id: "EMP-2087", facility: "SEA3", mount_position: "Left chest, forward facing", status: "online", battery_pct: 74, firmware: "0.9.4-demo", last_sync_at: ts(DAY1, "17:22:44"), stream_label: "sea3/vest/cam-2202", ring_linked: false, provenance: "proposed_hardware_simulated" },
  { device_id: "CAM-3310", model: "Guardian Vest Cam G1 (proposed hardware)", assigned_employee_id: "EMP-3311", facility: "PDX1", mount_position: "Left chest, forward facing", status: "online", battery_pct: 91, firmware: "0.9.4-demo", last_sync_at: ts(DAY1, "13:52:24"), stream_label: "pdx1/vest/cam-3310", ring_linked: false, provenance: "proposed_hardware_simulated" },
  { device_id: "CAM-4402", model: "Guardian Vest Cam G1 (proposed hardware)", assigned_employee_id: "EMP-4519", facility: "SFO7", mount_position: "Left chest, forward facing", status: "online", battery_pct: 63, firmware: "0.9.4-demo", last_sync_at: ts(DAY2, "12:12:14"), stream_label: "sfo7/vest/cam-4402", ring_linked: false, provenance: "proposed_hardware_simulated" },
  { device_id: "CAM-2203", model: "Guardian Dock Cam (proposed hardware)", assigned_employee_id: "", facility: "SEA3", mount_position: "Dock 4 gantry", status: "unassigned", battery_pct: 100, firmware: "0.9.1-demo", last_sync_at: ts(DAY1, "06:00:00"), stream_label: "sea3/dock/cam-2203", ring_linked: false, provenance: "proposed_hardware_simulated" },
  { device_id: "CAM-3311", model: "Guardian Vest Cam G1 (proposed hardware)", assigned_employee_id: "EMP-6733", facility: "PDX1", mount_position: "Right chest, forward facing", status: "degraded", battery_pct: 41, firmware: "0.9.2-demo", last_sync_at: ts(DAY1, "15:00:00"), stream_label: "pdx1/vest/cam-3311", ring_linked: false, provenance: "proposed_hardware_simulated" },
  { device_id: "CAM-9901", model: "Ring Video Doorbell (developer sandbox device)", assigned_employee_id: "", facility: "SFO7", mount_position: "Front porch, 1141 Larkspur Ave", status: "online", battery_pct: 96, firmware: "ring-sandbox", last_sync_at: ts(DAY2, "19:00:00"), stream_label: "ring/sandbox/doorbell-1141", ring_device_id: "ring-dev-88213", ring_linked: true, provenance: "ring_simulator" }
];

export const SCANNERS = [
  { device_id: "SC-4471", model: "Wearable ring scanner (2D)", assigned_employee_id: "EMP-1042", facility: "SEA3", connection_status: "connected", connection_type: "Bluetooth LE 5.2", session_status: "active", paired_camera_id: "CAM-2201", last_scan_at: ts(DAY2, "09:20:37"), battery_pct: 82, assignment_mismatch: false, diagnostic_note: "" },
  { device_id: "SC-4488", model: "Handheld barcode scanner", assigned_employee_id: "EMP-2087", facility: "SEA3", connection_status: "connected", connection_type: "Bluetooth LE 5.2", session_status: "active", paired_camera_id: "CAM-2202", last_scan_at: ts(DAY1, "18:05:11"), battery_pct: 66, assignment_mismatch: false, diagnostic_note: "" },
  { device_id: "SC-5120", model: "Handheld terminal with scanner", assigned_employee_id: "EMP-3311", facility: "PDX1", connection_status: "connected", connection_type: "Wi-Fi 6 / docked", session_status: "active", paired_camera_id: "CAM-3310", last_scan_at: ts(DAY1, "13:52:16"), battery_pct: 78, assignment_mismatch: false, diagnostic_note: "" },
  { device_id: "SC-5334", model: "Wearable ring scanner (2D)", assigned_employee_id: "EMP-4519", facility: "SFO7", connection_status: "connected", connection_type: "Bluetooth LE 5.2", session_status: "active", paired_camera_id: "CAM-4402", last_scan_at: ts(DAY2, "12:12:04"), battery_pct: 48, assignment_mismatch: false, diagnostic_note: "" },
  { device_id: "SC-5770", model: "Handheld barcode scanner", assigned_employee_id: "EMP-7832", facility: "SEA3", connection_status: "disconnected", connection_type: "Bluetooth LE 5.2", session_status: "ended", paired_camera_id: "CAM-2201", last_scan_at: ts(DAY2, "09:31:12"), battery_pct: 12, assignment_mismatch: false, diagnostic_note: "Shift ended — device returned to the charging cradle. Scans produced now would be queued, not attributed." },
  { device_id: "SC-5501", model: "Wearable ring scanner (2D)", assigned_employee_id: "", facility: "SEA3", connection_status: "error", connection_type: "unprovisioned", session_status: "idle", paired_camera_id: "", last_scan_at: ts(DAY2, "16:41:44"), battery_pct: 55, assignment_mismatch: true, diagnostic_note: "No work session bound. Device has never been paired to a Guardian camera, so scans cannot be attributed to a wearable recording." },
  { device_id: "SC-5612", model: "Handheld terminal with scanner", assigned_employee_id: "EMP-6733", facility: "PDX1", connection_status: "connected", connection_type: "Wi-Fi 6 / docked", session_status: "active", paired_camera_id: "CAM-3311", last_scan_at: ts(DAY1, "16:00:00"), battery_pct: 71, assignment_mismatch: false, diagnostic_note: "Paired camera CAM-3311 is degraded — capture may be intermittent." }
];

export const VEHICLES = [
  { truck_id: "TRK-8841", trailer_number: "TRL-2019", route_code: "SEA3-SFO7", driver_employee_id: "EMP-7832", facility: "SEA3", status: "arrived", departed_at: ts(DAY1, "16:12:40"), route_description: "Line haul, Puget Sound FC to Bay Area Delivery Station", last_dock_door: "DOCK-4" },
  { truck_id: "TRK-9412", trailer_number: "TRL-7720", route_code: "SEA3-DEN2", driver_employee_id: "EMP-7832", facility: "SEA3", status: "arrived", departed_at: ts(DAY1, "18:40:02"), route_description: "Line haul, Puget Sound FC to Front Range Sort Center", last_dock_door: "DOCK-6" },
  { truck_id: "TRK-9134", trailer_number: "TRL-3388", route_code: "SEA3-PDX1", driver_employee_id: "EMP-7832", facility: "SEA3", status: "departed", departed_at: ts(DAY1, "17:55:10"), route_description: "Line haul, Puget Sound FC to Columbia Sort Center", last_dock_door: "DOCK-2" },
  { truck_id: "TRK-9027", trailer_number: "TRL-1145", route_code: "SFO7-LOCAL", driver_employee_id: "EMP-4519", facility: "SFO7", status: "in_transit", departed_at: ts(DAY2, "09:04:52"), route_description: "Local delivery route, Bay Area Delivery Station", last_dock_door: "DOCK-1" },
  { truck_id: "TRK-9602", trailer_number: "TRL-5590", route_code: "PDX1-DEN2", driver_employee_id: "EMP-7832", facility: "PDX1", status: "held", departed_at: ts(DAY1, "15:40:12"), route_description: "Line haul, Columbia Sort Center to Front Range Sort Center", last_dock_door: "DOCK-3" }
];

// Evidence media. No real device recordings exist in this demonstration: each entry is a
// generated scene reconstruction rendered by the in-app evidence player, or an
// operator-uploaded sample recording.
export const CLIPS = [
  { clip_key: "CLIP-CONVEYOR-SCAN", title: "Inbound induction line 2", scene: "conveyor", camera_id: "CAM-2201", facility: "SEA3", scenario_key: "successful_delivery", recorded_start: ts(DAY1, "14:02:00"), recorded_end: ts(DAY1, "14:02:14"), description: "Sorter inducts parcels from the conveyor while scanning labels with a wearable ring scanner." },
  { clip_key: "CLIP-SORT-LINE", title: "Sortation lane 12", scene: "sortline", camera_id: "CAM-2202", facility: "SEA3", scenario_key: "successful_delivery", recorded_start: ts(DAY1, "14:26:40"), recorded_end: ts(DAY1, "14:26:54"), description: "Associate sorts a parcel into the outbound lane and confirms with a handheld scan." },
  { clip_key: "CLIP-DOCK-LOAD", title: "Dock 4 trailer loading", scene: "dock", camera_id: "CAM-2202", facility: "SEA3", scenario_key: "successful_delivery", recorded_start: ts(DAY1, "15:40:56"), recorded_end: ts(DAY1, "15:41:10"), description: "Parcel carried into trailer TRL-2019 at dock 4 and placed on the forward stack." },
  { clip_key: "CLIP-SORT-LINE-B", title: "Sortation lane 5", scene: "sortline", camera_id: "CAM-2201", facility: "SEA3", scenario_key: "delivered_but_missing", recorded_start: ts(DAY1, "15:19:52"), recorded_end: ts(DAY1, "15:20:06"), description: "Receiving scan at the inbound sortation lane." },
  { clip_key: "CLIP-SORT-LINE-C", title: "Outbound lane 8 (camera A)", scene: "sortline", camera_id: "CAM-2202", facility: "SEA3", scenario_key: "delivered_but_missing", recorded_start: ts(DAY1, "16:48:16"), recorded_end: ts(DAY1, "16:48:30"), description: "Overlapping capture window on the outbound lane — one of two candidate recordings." },
  { clip_key: "CLIP-SORT-LINE-D", title: "Outbound lane 8 (camera B)", scene: "sortline", camera_id: "CAM-2202", facility: "SEA3", scenario_key: "delivered_but_missing", recorded_start: ts(DAY1, "16:48:20"), recorded_end: ts(DAY1, "16:48:34"), description: "Second overlapping capture window on the outbound lane — creates an ambiguous match." },
  { clip_key: "CLIP-CONVEYOR-SCAN-B", title: "Inbound induction line 4", scene: "conveyor", camera_id: "CAM-2201", facility: "SEA3", scenario_key: "wrong_delivery_truck", recorded_start: ts(DAY1, "16:04:00"), recorded_end: ts(DAY1, "16:04:14"), description: "Inbound receiving scan of the parcel before sortation." },
  { clip_key: "CLIP-SORT-LINE-E", title: "Sortation lane 2", scene: "sortline", camera_id: "CAM-2202", facility: "SEA3", scenario_key: "wrong_delivery_truck", recorded_start: ts(DAY1, "16:31:00"), recorded_end: ts(DAY1, "16:31:14"), description: "Parcel sorted to the outbound lane for the Portland line haul." },
  { clip_key: "CLIP-DOCK-MISROUTE", title: "Dock 2 load — route check", scene: "dock_misroute", camera_id: "CAM-2202", facility: "SEA3", scenario_key: "wrong_delivery_truck", recorded_start: ts(DAY1, "17:22:30"), recorded_end: ts(DAY1, "17:22:44"), description: "Parcel carried past dock 2 and placed on a hand cart beside trailer TRL-3388 — a trailer that is not on this parcel's route." },
  { clip_key: "CLIP-TRAILER-RECOVERY", title: "Trailer recovery scan", scene: "trailer", camera_id: "CAM-2201", facility: "SEA3", scenario_key: "wrong_delivery_truck", recorded_start: ts(DAY2, "09:20:30"), recorded_end: ts(DAY2, "09:20:44"), description: "Associate locates the parcel inside a parked trailer and performs a corrective scan." },
  { clip_key: "CLIP-CONVEYOR-SCAN-C", title: "Inbound induction line 1", scene: "conveyor", camera_id: "CAM-2201", facility: "SEA3", scenario_key: "stolen_after_delivery", recorded_start: ts(DAY1, "11:48:10"), recorded_end: ts(DAY1, "11:48:24"), description: "Inbound receiving scan on the induction line." },
  { clip_key: "CLIP-SORT-LINE-F", title: "Sortation lane 9", scene: "sortline", camera_id: "CAM-2202", facility: "SEA3", scenario_key: "stolen_after_delivery", recorded_start: ts(DAY1, "12:15:40"), recorded_end: ts(DAY1, "12:15:54"), description: "Parcel sorted to the Bay Area lane." },
  { clip_key: "CLIP-PORCH-DELIVERY", title: "Courier porch delivery", scene: "porch", camera_id: "CAM-4402", facility: "SFO7", scenario_key: "successful_delivery", recorded_start: ts(DAY2, "11:12:00"), recorded_end: ts(DAY2, "11:12:14"), description: "Delivery associate approaches the porch, places the parcel on the mat and steps away." },
  { clip_key: "CLIP-PORCH-DELIVERY-B", title: "Courier porch delivery (second stop)", scene: "porch", camera_id: "CAM-4402", facility: "SFO7", scenario_key: "stolen_after_delivery", recorded_start: ts(DAY2, "12:12:00"), recorded_end: ts(DAY2, "12:12:14"), description: "Delivery associate places the parcel at the door and completes the delivery scan." },
  { clip_key: "CLIP-PORCH-THEFT", title: "Front porch after delivery", scene: "porch_theft", camera_id: "CAM-9901", facility: "SFO7", scenario_key: "stolen_after_delivery", recorded_start: ts(DAY2, "17:48:00"), recorded_end: ts(DAY2, "17:48:14"), description: "Doorbell camera capture: an unattended parcel is removed from the porch hours after the completed delivery. This is a generated reconstruction, not real device footage." },
  { clip_key: "CLIP-PALLET-OVERHEAD", title: "Pallet 6 overhead view", scene: "pallet", camera_id: "CAM-3310", facility: "PDX1", scenario_key: "missing_hub_scan", recorded_start: ts(DAY1, "13:45:00"), recorded_end: ts(DAY1, "13:45:14"), description: "Overhead capture of a staged pallet holding six parcels at the sort center." },
  { clip_key: "CLIP-PALLET-SCAN", title: "Pallet pick and scan attempt", scene: "pallet_scan", camera_id: "CAM-3310", facility: "PDX1", scenario_key: "missing_hub_scan", recorded_start: ts(DAY1, "13:52:10"), recorded_end: ts(DAY1, "13:52:24"), description: "Associate lifts a parcel from the pallet; the scanner triggers but no confirmed terminal record is produced." },
  { clip_key: "CLIP-PALLET-CORRECTIVE", title: "Pallet corrective scan", scene: "pallet_scan", camera_id: "CAM-3310", facility: "PDX1", scenario_key: "missing_hub_scan", recorded_start: ts(DAY2, "08:15:10"), recorded_end: ts(DAY2, "08:15:24"), description: "Supervisor re-scans the parcel and reconciles the missing sortation event." }
];

export const SOURCE_LABELS = {
  scene: "Generated scene reconstruction — not device footage",
  uploaded: "Operator-uploaded sample recording",
  ring: "Ring developer sandbox device (simulated event payload)",
  telemetry: "Vehicle / terminal telemetry (simulated)"
};

export const ACTIVITY_SEED = [
  { actor: "system", action: "Demo dataset provisioned for this session", entity_type: "Session", entity_ref: "seed", detail: "Five package scenarios loaded: 1 successful delivery, 1 disputed delivery, 1 wrong-trailer misroute, 1 post-delivery theft, 1 unconfirmed handling event.", at: ts(DAY1, "06:00:00"), severity: "info", category: "demo" },
  { actor: "Tomas Beck (EMP-4519)", action: "Delivery scan recorded", entity_type: "ScanEvent", entity_ref: "TBA304711885000", detail: "Confirmed delivery at recipient address, porch capture matched.", at: ts(DAY2, "11:12:07"), severity: "info", category: "scan" },
  { actor: "sync_engine", action: "Timestamp synchronization completed", entity_type: "ScanEvent", entity_ref: "TBA304711885000", detail: "Recording CLIP-PORCH-DELIVERY matched at offset 7s from a 14s capture window.", at: ts(DAY2, "11:12:09"), severity: "info", category: "sync" },
  { actor: "sync_engine", action: "Ambiguous recording match flagged", entity_type: "ScanEvent", entity_ref: "TBA304711902417", detail: "Two capture windows overlap the sortation timestamp on CAM-2202. Investigator selection required.", at: ts(DAY1, "16:48:24"), severity: "warning", category: "sync" },
  { actor: "sync_engine", action: "Delivery scan attributed to unpaired scanner", entity_type: "ScanEvent", entity_ref: "TBA304711902417", detail: "Scanner SC-5501 has no bound work session or paired camera.", at: ts(DAY2, "16:41:46"), severity: "critical", category: "sync" },
  { actor: "Marcus Oyelaran (EMP-2087)", action: "Trailer loading scan recorded", entity_type: "ScanEvent", entity_ref: "TBA304711915063", detail: "Scan confirmed at dock 2 for trailer TRL-3388.", at: ts(DAY1, "17:22:36"), severity: "info", category: "scan" },
  { actor: "ops_monitor", action: "Expected arrival scan not received", entity_type: "ScanEvent", entity_ref: "TBA304711915063", detail: "No arrival scan at PDX1 within the expected window.", at: ts(DAY1, "19:48:33"), severity: "warning", category: "scan" },
  { actor: "Priya Raman (EMP-3311)", action: "Handling event observed without confirmed scan", entity_type: "ScanEvent", entity_ref: "TBA304711933190", detail: "Visual handling recorded on CAM-3310; no confirmed terminal scan produced.", at: ts(DAY1, "13:52:16"), severity: "warning", category: "ai" },
  { actor: "Ellen Nakamura (EMP-5620)", action: "Investigation opened", entity_type: "Investigation", entity_ref: "CASE-2026-0418", detail: "Disputed delivery reviewed against available capture.", at: ts(DAY3, "08:20:00"), severity: "notice", category: "case" },
  { actor: "Ring adapter", action: "Developer sandbox device registered", entity_type: "GuardianCamera", entity_ref: "CAM-9901", detail: "Ring Video Doorbell reachable through the Ring developer sandbox. Event payloads are simulated; no Ring customer account is connected.", at: ts(DAY1, "06:00:00"), severity: "info", category: "ring" }
];