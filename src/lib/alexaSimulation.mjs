// Deterministic, inspectable tool execution for fictional Alexa+ package questions.
// This is a simulated agent tool, not a call to an Amazon Alexa/Ring account.
export function runPackageLookup(question, shipments = []) {
  const q = String(question || '').trim().toLowerCase();
  if (!q) return null;
  // An explicit tracking number takes precedence over broad "show/list" words.
  const identifier = q.match(/[a-z]*\d[a-z0-9-]{3,}/)?.[0] || q.match(/\b\d{4,}\b/)?.[0];
  const wantsList = !identifier && /\b(list|show|which|all|available)\b/.test(q) &&
    /\b(packages?|shipments?|deliveries)\b/.test(q);
  if (wantsList) {
    const packages = shipments.map(s => ({
      tracking_number: s.tracking_number,
      title: s.package_nickname || s.scenario_title || s.tracking_number,
      status: String(s.status || 'unknown').replaceAll('_', ' ')
    }));
    return {
      tool: 'list_demo_packages',
      reply: packages.length
        ? `I found ${packages.length} fictional packages. Choose one to view its details.`
        : 'No fictional packages are available in this demo session.',
      packages,
      route: '/packages'
    };
  }
  const isPackageQuestion = /\b(package|parcel|shipment|delivery|tracking|where|status|scanned|scan|received|arrived|missing)\b/.test(q);

  if (!identifier || !isPackageQuestion) return null;
  const exact = shipments.find(s => String(s.tracking_number).toLowerCase() === identifier);
  const suffixMatches = exact ? [] : shipments.filter(s => String(s.tracking_number).toLowerCase().endsWith(identifier));
  if (!exact && suffixMatches.length > 1) return {
    tool: 'get_package_status',
    reply: 'Multiple fictional packages share those final digits. Enter the complete tracking number to see the correct record.',
    route: '/packages',
    packages: []
  };
  const match = exact || suffixMatches[0];
  if (!match) return { tool: 'get_package_status', reply: 'That number is not in the current fictional session. Open Packages to choose an available delivery.', route: '/packages', packages: [] };
  const status = String(match.status || 'unknown').replaceAll('_', ' ');
  const facility = match.last_known_location || match.current_facility || 'not recorded';
  return {
    tool: 'get_package_status',
    reply: `Demo package ${match.tracking_number}: current recorded status is ${status}. Last recorded location: ${facility}. This is fictional package data, not a verified live carrier update.`,
    packages: [{ tracking_number: match.tracking_number, title: match.package_nickname || match.scenario_title || match.tracking_number, status }],
    route: `/packages/${encodeURIComponent(match.tracking_number)}`
  };
}
