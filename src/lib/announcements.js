import { SHIPMENT_STATUS } from '@/lib/status';

// Turns the five demonstration scenarios into spoken announcements.
//
// Every sentence is derived from the stored shipment record, so what the voice says always
// matches what the console shows. The voice states the evidence; it never asserts a cause.

function spokenFor(shipment, tail, caseNumber) {
  switch (shipment.status) {
    case 'delivered_received':
      return {
        tone: 'ok',
        title: 'Delivery confirmed',
        spoken:
          'Delivery confirmed. Package ending ' + tail + ' was scanned and filmed at ' +
          (shipment.destination_city || 'the destination') + ', and the recipient accepted it.'
      };
    case 'delivered_no_receipt':
      return {
        tone: 'warn',
        title: 'Delivery disputed',
        spoken:
          'Package ending ' + tail + ' needs review. The delivery scan and the camera agree, but the ' +
          'recipient reports that nothing arrived.' + (caseNumber ? ' Case ' + caseNumber + ' is open.' : '')
      };
    case 'misrouted':
      return {
        tone: 'danger',
        title: 'Wrong trailer',
        spoken:
          'Attention. Package ending ' + tail + ' was scanned onto the wrong trailer at ' +
          (shipment.current_facility || 'the origin facility') +
          '. The scan is valid, and the recording shows it loaded beside the wrong trailer.'
      };
    case 'missing':
      return {
        tone: 'danger',
        title: 'Scan missing',
        spoken:
          'Package ending ' + tail + ' was last seen at ' + (shipment.last_known_location || 'an unknown location') +
          '. The next scan never arrived, and no recording covers that window.'
      };
    case 'scan_exception':
      return {
        tone: 'warn',
        title: 'Unconfirmed scan',
        spoken:
          'Package ending ' + tail + ' has an unconfirmed scan at ' +
          (shipment.current_facility || 'its current facility') +
          '. The recording matched the event, but the scan itself was never confirmed.'
      };
    default:
      return {
        tone: 'info',
        title: 'Custody update',
        spoken:
          'Package ending ' + tail + ' is ' + (SHIPMENT_STATUS[shipment.status]?.label || 'in progress') +
          '. No discrepancy is recorded for this package.'
      };
  }
}

export function buildAnnouncements(board) {
  if (!board || !board.shipments) return [];
  return board.shipments.map((shipment) => {
    const tail = (shipment.tracking_number || '').slice(-6);
    const openCase = (board.cases || []).find((c) => c.tracking_number === shipment.tracking_number);
    const script = spokenFor(shipment, tail, openCase ? openCase.case_number : '');
    return {
      key: shipment.tracking_number,
      tracking: shipment.tracking_number,
      statusLabel: SHIPMENT_STATUS[shipment.status]?.label || shipment.status,
      caseNumber: openCase ? openCase.case_number : '',
      tone: script.tone,
      title: script.title,
      spoken: script.spoken
    };
  });
}