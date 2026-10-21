import unittest
from src.server import fixture_events

class FixtureIntegrationTests(unittest.TestCase):
    def test_provenance_and_expected_correlations(self):
        feed=fixture_events()
        self.assertEqual(feed["source"],"synthetic_not_amazon")
        self.assertEqual(feed["mode"],"simulation")
        self.assertEqual({e["trackingId"] for e in feed["events"]},{"SIM-1001","SIM-1004"})
        self.assertTrue(all(e["ringEventVerified"] is False and e["videoAvailable"] is False for e in feed["events"]))

if __name__=="__main__":
    unittest.main()
