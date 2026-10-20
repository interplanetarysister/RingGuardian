import unittest
from src.core import *
class CoreTests(unittest.TestCase):
    def setUp(self):
        self.session=Session("work","cam","scanner","hub")
        self.scan=Scan("event","SIM-PARCEL","scanner","work","hub","2026-10-20T10:00:00Z","loaded")
        self.clip=Segment("clip","cam","work","2026-10-20T09:59:45Z","2026-10-20T10:00:40Z")
    def test_match(self):
        self.assertEqual(match(self.scan,self.session,[self.clip])["seek_offset_ms"],15000)
    def test_wrong_scanner(self):
        self.assertIsNone(match(Scan("e","p","other","work","hub",self.scan.scanned_at,"loaded"),self.session,[self.clip]))
    def test_ambiguous_video(self):
        self.assertIsNone(match(self.scan,self.session,[self.clip,Segment("clip2","cam","work",self.clip.start,self.clip.end)]))
    def test_csv(self):
        self.assertIn("SIM-PARCEL",export_csv([self.scan],{"event":match(self.scan,self.session,[self.clip])}))
    def test_approval(self):
        with self.assertRaises(PermissionError):EvidenceRequest("r","p")
        req=EvidenceRequest("r","p",True)
        with self.assertRaises(PermissionError):req.approve_summary("Safe")
        req.approve_summary("Approved redacted summary",True)
        self.assertEqual(req.public_view()["status"],"approved_summary")
    def test_future_state_requires_official_scan(self):
        self.assertEqual(next_state(UNCONFIRMED,True,True,False,False),HOLDING)
        self.assertEqual(next_state(HOLDING,True,True,True,True),SCANNED)
        self.assertNotEqual(next_state(HOLDING,True,True,False,True),SCANNED)
if __name__=="__main__":unittest.main()
