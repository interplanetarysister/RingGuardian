// Ring Guardian Cam — the five package scenarios.
// Every tracking number, name, facility and timestamp is fictional and deterministic,
// so the demo produces identical results on every run.

import { ts, DAY1, DAY2, DAY3 } from "./fixtures.ts";

export const SCENARIOS = [
  {
    scenario_key: "successful_delivery",
    scenario_title: "Delivered and received",
    shipment: {
      tracking_number: "TBA304711885000",
      recipient_name: "A. Rivera",
      destination_city: "Oakland, CA",
      origin_facility: "SEA3",
      current_facility: "SFO7",
      last_known_location: "Front porch, 1141 Larkspur Ave, Oakland CA",
      expected_destination: "1141 Larkspur Ave, Oakland CA",
      last_verified_scan_at: ts(DAY2, "11:12:07"),
      promised_date: "2026-10-20",
      delivered_at: ts(DAY2, "11:12:07"),
      weight_lb: 2.4,
      dimensions: "12 x 9 x 4 in",
      declared_value_usd: 74.5,
      contents_summary: "Household electronics accessory",
      status: "delivered_received",
      discrepancy_flag: false,
      discrepancy_reason: "",
      investigation_status: "none",
      evidence_status: "available",
      scenario_summary: "Complete custody chain with captured evidence at every physical handling point. No unresolved warnings."
    },
    events: [
      { sequence: 1, event_type: "receiving", event_label: "Inbound receiving scan — dock 4", occurred_at: ts(DAY1, "14:02:11"), scanner_id: "SC-4471", camera_id: "CAM-2201", employee_id: "EMP-1042", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "Parcel inducted onto induction line 2." },
      { sequence: 2, event_type: "sorting", event_label: "Sortation scan — outbound lane 12", occurred_at: ts(DAY1, "14:26:48"), scanner_id: "SC-4488", camera_id: "CAM-2202", employee_id: "EMP-2087", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "" },
      { sequence: 3, event_type: "loading", event_label: "Trailer loading scan — TRL-2019", occurred_at: ts(DAY1, "15:41:03"), scanner_id: "SC-4488", camera_id: "CAM-2202", employee_id: "EMP-2087", facility: "SEA3", vehicle: "TRK-8841", scan_status: "confirmed", note: "" },
      { sequence: 4, event_type: "departure", event_label: "Trailer departed SEA3", occurred_at: ts(DAY1, "16:12:40"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "SEA3", vehicle: "TRK-8841", scan_status: "confirmed", note: "Vehicle movement event — no wearable capture required." },
      { sequence: 5, event_type: "arrival", event_label: "Trailer arrived SFO7", occurred_at: ts(DAY2, "06:31:19"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "SFO7", vehicle: "TRK-8841", scan_status: "confirmed", note: "Vehicle movement event — no wearable capture required." },
      { sequence: 6, event_type: "delivery", event_label: "Delivery scan at recipient address", occurred_at: ts(DAY2, "11:12:07"), scanner_id: "SC-5334", camera_id: "CAM-4402", employee_id: "EMP-4519", facility: "SFO7", vehicle: "", scan_status: "confirmed", note: "" },
      { sequence: 7, event_type: "verification", event_label: "Recipient confirmation recorded", occurred_at: ts(DAY2, "11:14:30"), scanner_id: "", camera_id: "", employee_id: "EMP-4519", facility: "SFO7", vehicle: "", scan_status: "confirmed", note: "Customer-facing confirmation event — terminal only." }
    ],
    case: null
  },
  {
    scenario_key: "delivered_but_missing",
    scenario_title: "Marked delivered, recipient reports missing",
    shipment: {
      tracking_number: "TBA304711902417",
      recipient_name: "M. Okafor",
      destination_city: "Boulder, CO",
      origin_facility: "SEA3",
      current_facility: "DEN2",
      last_known_location: "Marked delivered at 3406 Aspen Way, Boulder CO — location not visually confirmed",
      expected_destination: "3406 Aspen Way, Boulder CO",
      last_verified_scan_at: ts(DAY2, "16:41:44"),
      promised_date: "2026-10-20",
      delivered_at: ts(DAY2, "16:41:44"),
      weight_lb: 5.1,
      dimensions: "16 x 12 x 8 in",
      declared_value_usd: 189.0,
      contents_summary: "Two-unit home appliance order",
      status: "delivered_no_receipt",
      discrepancy_flag: true,
      discrepancy_reason: "A delivery confirmation exists, but the recipient reports non-receipt and the only scan in that window came from an unpaired scanner with no wearable capture. The available footage does not show a delivery taking place.",
      investigation_status: "open",
      evidence_status: "partial",
      scenario_summary: "Delivery is claimed by the terminal record; no supporting capture exists. The demo never concludes that theft occurred — it surfaces what the evidence does and does not show."
    },
    events: [
      { sequence: 1, event_type: "receiving", event_label: "Inbound receiving scan — sortation lane 5", occurred_at: ts(DAY1, "15:20:04"), scanner_id: "SC-4471", camera_id: "CAM-2201", employee_id: "EMP-1042", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "" },
      { sequence: 2, event_type: "sorting", event_label: "Sortation scan — outbound lane 8", occurred_at: ts(DAY1, "16:48:22"), scanner_id: "SC-4488", camera_id: "CAM-2202", employee_id: "EMP-2087", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "Two recordings overlap this timestamp." },
      { sequence: 3, event_type: "loading", event_label: "Trailer loading scan — TRL-7720", occurred_at: ts(DAY1, "18:05:11"), scanner_id: "SC-4488", camera_id: "CAM-2202", employee_id: "EMP-2087", facility: "SEA3", vehicle: "TRK-9412", scan_status: "confirmed", note: "" },
      { sequence: 4, event_type: "departure", event_label: "Trailer departed SEA3", occurred_at: ts(DAY1, "18:40:02"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "SEA3", vehicle: "TRK-9412", scan_status: "confirmed", note: "Vehicle movement event." },
      { sequence: 5, event_type: "arrival", event_label: "Trailer arrived DEN2", occurred_at: ts(DAY2, "07:12:55"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "DEN2", vehicle: "TRK-9412", scan_status: "confirmed", note: "Vehicle movement event." },
      { sequence: 6, event_type: "delivery", event_label: "Carrier delivery confirmation recorded", occurred_at: ts(DAY2, "16:41:44"), scanner_id: "SC-5501", camera_id: "CAM-2203", employee_id: "EMP-5620", facility: "DEN2", vehicle: "", scan_status: "confirmed", note: "Scan arrived from an unprovisioned scanner with no bound work session." },
      { sequence: 7, event_type: "verification", event_label: "Delivery confirmation closed on terminal", occurred_at: ts(DAY2, "16:42:10"), scanner_id: "", camera_id: "", employee_id: "EMP-5620", facility: "DEN2", vehicle: "", scan_status: "delayed", note: "Confirmation posted 26 seconds after the scan." },
      { sequence: 8, event_type: "exception", event_label: "Recipient reported package not received", occurred_at: ts(DAY3, "08:15:00"), scanner_id: "", camera_id: "", employee_id: "", facility: "DEN2", vehicle: "", scan_status: "confirmed", note: "Customer report received through the Package P.I. application." }
    ],
    case: {
      category: "Disputed delivery",
      priority: "high",
      status: "open",
      title: "Delivery confirmed on terminal, no supporting capture",
      summary: "Recipient reports the parcel was never received. The terminal shows a delivery confirmation at 16:41:44 from scanner SC-5501, which is not bound to any work session and has no paired Guardian camera. No recording covers the claimed delivery window.",
      findings: "The confirmation scan cannot be attributed to a wearable recording. The available capture at the facility does not show a delivery transaction at the claimed time.",
      recommended_actions: [
        "Request physical verification at the delivery address",
        "Retrieve handheld terminal session logs for scanner SC-5501",
        "Confirm the assigned route vehicle and driver work session",
        "Record the outcome without asserting cause"
      ],
      evidence_summary: "Partial — one ambiguous sortation match, one missing capture window, one unattributable delivery scan."
    }
  },
  {
    scenario_key: "wrong_delivery_truck",
    scenario_title: "Scanned correctly, loaded onto the wrong trailer",
    shipment: {
      tracking_number: "TBA304711915063",
      recipient_name: "L. Fontaine",
      destination_city: "Portland, OR",
      origin_facility: "SEA3",
      current_facility: "SEA3",
      last_known_location: "Loaded at dock 2, Puget Sound Fulfillment Center",
      expected_destination: "88 Northrup St, Portland OR",
      last_verified_scan_at: ts(DAY1, "17:22:36"),
      promised_date: "2026-10-21",
      delivered_at: "",
      weight_lb: 8.7,
      dimensions: "20 x 14 x 10 in",
      declared_value_usd: 240.0,
      contents_summary: "Flat-pack furniture hardware",
      status: "misrouted",
      discrepancy_flag: true,
      discrepancy_reason: "The loading scan at dock 2 is valid, but the recorded handling shows the parcel placed beside trailer TRL-3388, which is not on this parcel's route to PDX1.",
      investigation_status: "investigating",
      evidence_status: "available",
      scenario_summary: "A valid scan with a valid recording that contradicts the logistics record. Recovery is performed inside the demo and updates the package permanently."
    },
    events: [
      { sequence: 1, event_type: "receiving", event_label: "Inbound receiving scan — induction line 4", occurred_at: ts(DAY1, "16:04:12"), scanner_id: "SC-4471", camera_id: "CAM-2201", employee_id: "EMP-1042", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "" },
      { sequence: 2, event_type: "sorting", event_label: "Sortation scan — outbound lane 2", occurred_at: ts(DAY1, "16:31:05"), scanner_id: "SC-4488", camera_id: "CAM-2202", employee_id: "EMP-2087", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "Lane 2 routes to the Portland line haul." },
      { sequence: 3, event_type: "loading", event_label: "Loading scan — dock 2, TRL-3388", occurred_at: ts(DAY1, "17:22:36"), scanner_id: "SC-4488", camera_id: "CAM-2202", employee_id: "EMP-2087", facility: "SEA3", vehicle: "TRK-9134", scan_status: "confirmed", note: "Scan is valid. Recorded handling shows the parcel placed beside the trailer rather than inside it." },
      { sequence: 4, event_type: "departure", event_label: "Trailer departed SEA3", occurred_at: ts(DAY1, "17:55:10"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "SEA3", vehicle: "TRK-9134", scan_status: "confirmed", note: "Vehicle movement event." },
      { sequence: 5, event_type: "exception", event_label: "Expected arrival scan not received at PDX1", occurred_at: ts(DAY1, "19:48:33"), scanner_id: "", camera_id: "", employee_id: "", facility: "PDX1", vehicle: "TRK-9134", scan_status: "missed", note: "No arrival scan recorded within the expected window." }
    ],
    case: {
      category: "Misroute — wrong trailer",
      priority: "medium",
      status: "investigating",
      title: "Parcel loaded beside the wrong trailer at dock 2",
      summary: "Every scan for this parcel is valid. The recorded handling at 17:22:36 shows the parcel placed on a hand cart next to trailer TRL-3388 instead of being loaded into it, and the parcel never received an arrival scan at PDX1.",
      findings: "Scanner and camera agree on the timestamp. The physical action contradicts the intended route assignment.",
      recommended_actions: [
        "Request physical verification of trailer TRL-3388 and the adjacent cart position",
        "Perform a corrective scan when the parcel is located",
        "Update the logistics record to reflect the recovered location"
      ],
      evidence_summary: "Available — the loading event is fully captured with a matched recording."
    }
  },
  {
    scenario_key: "stolen_after_delivery",
    scenario_title: "Delivered correctly, then removed from the porch",
    shipment: {
      tracking_number: "TBA304711927744",
      recipient_name: "J. Whitlock",
      destination_city: "Oakland, CA",
      origin_facility: "SEA3",
      current_facility: "SFO7",
      last_known_location: "Front porch, 1141 Larkspur Ave, Oakland CA",
      expected_destination: "1141 Larkspur Ave, Oakland CA",
      last_verified_scan_at: ts(DAY2, "12:12:04"),
      promised_date: "2026-10-20",
      delivered_at: ts(DAY2, "12:12:04"),
      weight_lb: 1.8,
      dimensions: "10 x 8 x 3 in",
      declared_value_usd: 129.99,
      contents_summary: "Compact audio accessory",
      status: "missing",
      discrepancy_flag: true,
      discrepancy_reason: "The delivery itself completed correctly and is fully captured. A separate capture hours later shows the unattended parcel being removed from the porch.",
      investigation_status: "investigating",
      evidence_status: "available",
      scenario_summary: "Two distinct events at the same address: a properly completed delivery, and a later removal of the unattended parcel. The two are never conflated."
    },
    events: [
      { sequence: 1, event_type: "receiving", event_label: "Inbound receiving scan — induction line 1", occurred_at: ts(DAY1, "11:48:20"), scanner_id: "SC-4471", camera_id: "CAM-2201", employee_id: "EMP-1042", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "" },
      { sequence: 2, event_type: "sorting", event_label: "Sortation scan — outbound lane 9", occurred_at: ts(DAY1, "12:15:44"), scanner_id: "SC-4488", camera_id: "CAM-2202", employee_id: "EMP-2087", facility: "SEA3", vehicle: "", scan_status: "confirmed", note: "" },
      { sequence: 3, event_type: "departure", event_label: "Trailer departed SEA3", occurred_at: ts(DAY1, "13:02:18"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "SEA3", vehicle: "TRK-9027", scan_status: "confirmed", note: "Vehicle movement event." },
      { sequence: 4, event_type: "arrival", event_label: "Trailer arrived SFO7", occurred_at: ts(DAY1, "20:11:06"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "SFO7", vehicle: "TRK-9027", scan_status: "confirmed", note: "Vehicle movement event." },
      { sequence: 5, event_type: "delivery", event_label: "Delivery scan at recipient address", occurred_at: ts(DAY2, "12:12:04"), scanner_id: "SC-5334", camera_id: "CAM-4402", employee_id: "EMP-4519", facility: "SFO7", vehicle: "", scan_status: "confirmed", note: "Delivery completed and captured. This event is not disputed." },
      { sequence: 6, event_type: "exception", event_label: "Parcel removed from porch after delivery", occurred_at: ts(DAY2, "17:48:07"), scanner_id: "", camera_id: "CAM-9901", employee_id: "", facility: "SFO7", vehicle: "", scan_status: "confirmed", note: "Post-delivery capture from the address doorbell camera. The individual is not identifiable." },
      { sequence: 7, event_type: "exception", event_label: "Recipient reported package not received", occurred_at: ts(DAY2, "19:22:40"), scanner_id: "", camera_id: "", employee_id: "", facility: "SFO7", vehicle: "", scan_status: "confirmed", note: "Customer report received through the Package P.I. application." }
    ],
    case: {
      category: "Post-delivery removal",
      priority: "high",
      status: "investigating",
      title: "Delivery completed, parcel removed hours later",
      summary: "The parcel was delivered and the delivery was captured. Four hours later an unattended-package capture shows the parcel being taken from the porch. Delivery completion is not in question.",
      findings: "Delivery event fully matched to capture. The removal event is a separate incident at the same address and is also captured. The individual in the later capture is not identifiable in the recorded evidence.",
      recommended_actions: [
        "Document both events separately in the incident record",
        "Provide the recipient the delivery capture confirming completion",
        "Escalate the later removal through the customer's incident process",
        "Do not attribute the removal to any employee"
      ],
      evidence_summary: "Available — delivery capture and post-delivery capture both matched to their timestamps."
    }
  },
  {
    scenario_key: "missing_hub_scan",
    scenario_title: "Physically handled, no confirmed scan",
    shipment: {
      tracking_number: "TBA304711933190",
      recipient_name: "R. Adeyemi",
      destination_city: "Boise, ID",
      origin_facility: "PDX1",
      current_facility: "PDX1",
      last_known_location: "Pallet 6, sortation floor, Columbia Sort Center",
      expected_destination: "2214 Meridian Rd, Boise ID",
      last_verified_scan_at: ts(DAY1, "13:45:07"),
      promised_date: "2026-10-22",
      delivered_at: "",
      weight_lb: 3.2,
      dimensions: "14 x 10 x 6 in",
      declared_value_usd: 96.0,
      contents_summary: "Specialty tool kit",
      status: "scan_exception",
      discrepancy_flag: true,
      discrepancy_reason: "The parcel was physically handled at 13:52:16 and the handling was recorded, but no confirmed sortation scan was produced. The parcel never entered an outbound lane.",
      investigation_status: "open",
      evidence_status: "partial",
      scenario_summary: "The clearest case for hands-free visual tracking: the handling is visible, the official scan is absent. This scenario also drives the AI state-machine preview."
    },
    events: [
      { sequence: 1, event_type: "receiving", event_label: "Inbound receiving scan — Pallet 6", occurred_at: ts(DAY1, "13:45:07"), scanner_id: "SC-5120", camera_id: "CAM-3310", employee_id: "EMP-3311", facility: "PDX1", vehicle: "", scan_status: "confirmed", note: "Parcel staged on pallet 6." },
      { sequence: 2, event_type: "handling", event_label: "Handling observed — no confirmed scan", occurred_at: ts(DAY1, "13:52:16"), scanner_id: "SC-5120", camera_id: "CAM-3310", employee_id: "EMP-3311", facility: "PDX1", vehicle: "", scan_status: "unconfirmed", note: "The scanner triggered but produced no confirmed terminal record." },
      { sequence: 3, event_type: "exception", event_label: "Expected sortation scan not received", occurred_at: ts(DAY1, "14:20:00"), scanner_id: "", camera_id: "", employee_id: "", facility: "PDX1", vehicle: "", scan_status: "missed", note: "No sortation scan within the expected window." },
      { sequence: 4, event_type: "departure", event_label: "Trailer departed PDX1 without this parcel", occurred_at: ts(DAY1, "15:40:12"), scanner_id: "", camera_id: "", employee_id: "EMP-7832", facility: "PDX1", vehicle: "TRK-9602", scan_status: "confirmed", note: "Vehicle movement event — parcel not manifested." }
    ],
    case: {
      category: "Unconfirmed handling event",
      priority: "medium",
      status: "open",
      title: "Recorded handling with no confirmed sortation scan",
      summary: "The parcel was lifted from pallet 6 at 13:52:16, and the handling was captured. No confirmed sortation scan followed and the parcel was never manifested onto an outbound trailer.",
      findings: "Visual handling evidence exists. The authoritative scan does not. Under the proposed design the camera cannot create an official scan — only a supervisor can reconcile one.",
      recommended_actions: [
        "Request supervisor review of the handling capture",
        "Perform a corrective scan when the parcel is located",
        "Reconcile the logistics record against the corrected scan",
        "Log the incident for scanner reliability follow-up"
      ],
      evidence_summary: "Partial — handling capture available, no scan evidence to compare against."
    }
  }
];

export const FOOTAGE_REQUEST_SEED = [
  {
    request_id: "REQ-PPI-10021",
    requester_system: "Package P.I. (companion application)",
    tracking_number: "TBA304711902417",
    status: "pending",
    requested_at: ts(DAY3, "08:20:00"),
    reviewer: "",
    scope: "Delivery window 2026-10-20 16:30-16:50 at destination address",
    justification: "Customer disputes delivery. Requesting any capture covering the claimed delivery window, redacted as required.",
    api_version: "1.0.0",
    redaction_level: "",
    response_summary: "",
    decision_note: "",
    delivered_clip_key: ""
  },
  {
    request_id: "REQ-PPI-10022",
    requester_system: "Package P.I. (companion application)",
    tracking_number: "TBA304711927744",
    status: "pending",
    requested_at: ts(DAY3, "09:05:00"),
    reviewer: "",
    scope: "Post-delivery window 2026-10-20 17:30-18:00 at destination address",
    justification: "Customer reports parcel missing after delivery confirmation. Requesting capture of the period after the delivery scan.",
    api_version: "1.0.0",
    redaction_level: "",
    response_summary: "",
    decision_note: "",
    delivered_clip_key: ""
  }
];