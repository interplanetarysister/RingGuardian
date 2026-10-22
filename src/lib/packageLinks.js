// Centralize profile links so a selected package always opens its own record.
export function packageProfilePath(trackingNumber, fromCustomer = false) {
  const path = `/packages/${encodeURIComponent(String(trackingNumber))}`;
  return fromCustomer ? `${path}?from=customer` : path;
}

export function packageProfileBackPath(trackingNumber, searchParams) {
  return searchParams.get('from') === 'customer'
    ? `/view/customer?tracking=${encodeURIComponent(String(trackingNumber))}`
    : '/packages';
}
