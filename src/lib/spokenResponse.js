// Speech-only transformations. Never modify the written evidence or tracking data.
export function spokenResponse(value) {
  return String(value || '')
    .replace(/\b(?:TBA|1Z|[A-Z]{2,4})[A-Z0-9-]*\d{5,}\b/gi, match => 'package ending in ' + match.replace(/\D/g, '').slice(-4).split('').join(' '))
    .replace(/\b\d{7,}\b/g, match => 'number ending in ' + match.slice(-4).split('').join(' '))
    .replace(/\s+/g, ' ').trim();
}