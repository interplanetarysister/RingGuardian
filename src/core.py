"""Scanner-to-video evidence linking reference; all data synthetic."""
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import csv,io
def parse_utc(value):
    dt=datetime.fromisoformat(value.replace("Z","+00:00"))
    if dt.tzinfo is None: raise ValueError("Timezone required")
    return dt.astimezone(timezone.utc)
@dataclass(frozen=True)
class Session:
    id:str
    camera_id:str
    scanner_id:str
    facility_id:str
@dataclass(frozen=True)
class Scan:
    id:str
    package_id:str
    scanner_id:str
    session_id:str
    facility_id:str
    scanned_at:str
    event_type:str
    verified:bool=True
@dataclass(frozen=True)
class Segment:
    id:str
    camera_id:str
    session_id:str
    start:str
    end:str
    uncertainty_ms:int=0
def match(scan,session,segments,before_s=5,after_s=30):
    if not scan.verified or scan.session_id!=session.id or scan.scanner_id!=session.scanner_id or scan.facility_id!=session.facility_id:return None
    t=parse_utc(scan.scanned_at); candidates=[]
    for clip in segments:
        if clip.camera_id!=session.camera_id or clip.session_id!=session.id:continue
        start=parse_utc(clip.start);end=parse_utc(clip.end)
        if start-timedelta(milliseconds=clip.uncertainty_ms)<=t<=end+timedelta(milliseconds=clip.uncertainty_ms):
            candidates.append((clip.uncertainty_ms,clip.id,clip))
    if not candidates:return None
    candidates.sort(key=lambda x:(x[0],x[1]))
    if len(candidates)>1 and candidates[0][0]==candidates[1][0]:return None
    clip=candidates[0][2]
    offset=max(0,int((t-parse_utc(clip.start)).total_seconds()*1000))
    return {"scan_event_id":scan.id,"video_segment_id":clip.id,"seek_offset_ms":offset,"uncertainty_ms":clip.uncertainty_ms,"completeness":parse_utc(clip.start)<=t-timedelta(seconds=before_s) and parse_utc(clip.end)>=t+timedelta(seconds=after_s)}
def export_csv(scans,matches):
    buf=io.StringIO();w=csv.writer(buf)
    w.writerow(["scan_event_id","package_id","scan_at_utc","facility","event","camera_segment_id","seek_offset_ms","match_status"])
    for s in scans:
        m=matches.get(s.id)
        w.writerow([s.id,s.package_id,s.scanned_at,s.facility_id,s.event_type,m["video_segment_id"] if m else "",m["seek_offset_ms"] if m else "","matched" if m else "unmatched"])
    return buf.getvalue()
class EvidenceRequest:
    def __init__(self,request_id,package_id,ownership_verified=False):
        if not ownership_verified:raise PermissionError("Shipment ownership not verified")
        self.request_id=request_id;self.package_id=package_id;self.status="pending";self.approved_summary=None
    def approve_summary(self,summary,reviewer_is_authorized=False):
        if not reviewer_is_authorized:raise PermissionError("Reviewer authorization required")
        self.status="approved_summary";self.approved_summary=summary
    def public_view(self):return {"request_id":self.request_id,"status":self.status,"summary":self.approved_summary}
UNCONFIRMED="STATE_UNCONFIRMED";HOLDING="STATE_HOLDING";SCANNED="STATE_SCANNED"
def next_state(previous,hand_near,moving,official_scan_validated,object_event_correlated):
    if official_scan_validated and object_event_correlated:return SCANNED
    if previous==SCANNED:return SCANNED
    if hand_near and moving:return HOLDING
    return UNCONFIRMED
