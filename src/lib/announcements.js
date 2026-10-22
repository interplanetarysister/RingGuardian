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
          'Simulated delivery confirmed. Package ending ' + tail + ' has a completed delivery record at ' +
          (shipment.destination_city || 'the destination') + '. The sample recipient is marked as having received it.'
      };
    case 'delivered_no_receipt':
      return {
        tone: 'warn',
        title: 'Delivery disputed',
        spoken:
          'Simulated package ending ' + tail + ' needs review. The carrier record says delivered, but the recipient reports missing. This is a delivery discrepancy, not proof of theft.' + (caseNumber ? ' Case ' + caseNumber + ' is open.' : '')
      };
    case 'misrouted':
      return {
        tone: 'danger',
        title: 'Wrong trailer',
        spoken:
          'Attention. Simulated package ending ' + tail + ' needs review at ' +
          (shipment.current_facility || 'the origin facility') +
          '. The scan was accepted, but the reconstructed scene shows the parcel placed beside trailer T R L three three eight eight, rather than confirmed inside its assigned trailer.'
      };
    case 'missing':
      return {
        tone: 'danger',
        title: 'Scan missing',
        spoken:
          'Simulated package ending ' + tail + ' is marked missing. Review the last recorded location, ' + (shipment.last_known_location || 'unknown') +
          ', and compare its handling evidence. Do not infer theft or a verified real-world outcome.'
      };
    case 'scan_exception':
      return {
        tone: 'warn',
        title: 'Unconfirmed scan',
        spoken:
          'Simulated package ending ' + tail + ' has an unconfirmed scan at ' +
          (shipment.current_facility || 'its current facility') +
          '. The recording matched the event, but the scan itself was never confirmed.'
      };
    default:
      return {
        tone: 'info',
        title: 'Custody update',
        spoken:
          'Simulated package ending ' + tail + ' is ' + (SHIPMENT_STATUS[shipment.status]?.label || 'in progress') +
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