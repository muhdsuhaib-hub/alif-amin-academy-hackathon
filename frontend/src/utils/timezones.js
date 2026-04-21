// Comprehensive IANA timezone list via browser API with fallback
let _cache = null;

export function getTimezones() {
  if (_cache) return _cache;
  try {
    _cache = Intl.supportedValuesOf('timeZone');
  } catch {
    // Fallback for older browsers
    _cache = [
      'Africa/Cairo','Africa/Casablanca','Africa/Johannesburg','Africa/Lagos','Africa/Nairobi',
      'America/Anchorage','America/Argentina/Buenos_Aires','America/Bogota','America/Chicago',
      'America/Denver','America/Halifax','America/Lima','America/Los_Angeles','America/Mexico_City',
      'America/New_York','America/Phoenix','America/Santiago','America/Sao_Paulo','America/Toronto',
      'America/Vancouver','Asia/Almaty','Asia/Baghdad','Asia/Bahrain','Asia/Bangkok','Asia/Colombo',
      'Asia/Dhaka','Asia/Dubai','Asia/Hong_Kong','Asia/Istanbul','Asia/Jakarta','Asia/Karachi',
      'Asia/Kolkata','Asia/Kuala_Lumpur','Asia/Kuwait','Asia/Manila','Asia/Muscat','Asia/Riyadh',
      'Asia/Seoul','Asia/Shanghai','Asia/Singapore','Asia/Taipei','Asia/Tashkent','Asia/Tehran',
      'Asia/Tokyo','Atlantic/Reykjavik','Australia/Adelaide','Australia/Brisbane','Australia/Melbourne',
      'Australia/Perth','Australia/Sydney','Europe/Amsterdam','Europe/Athens','Europe/Berlin',
      'Europe/Brussels','Europe/Dublin','Europe/Helsinki','Europe/Istanbul','Europe/Lisbon',
      'Europe/London','Europe/Madrid','Europe/Moscow','Europe/Oslo','Europe/Paris','Europe/Prague',
      'Europe/Rome','Europe/Stockholm','Europe/Vienna','Europe/Warsaw','Europe/Zurich',
      'Pacific/Auckland','Pacific/Fiji','Pacific/Honolulu','US/Eastern','US/Central','US/Mountain',
      'US/Pacific','UTC',
    ];
  }
  return _cache;
}

/** Format a UTC ISO string in a specific IANA timezone */
export function formatInTimezone(utcStr, tz, opts = {}) {
  if (!utcStr) return '';
  try {
    const d = new Date(utcStr.endsWith('Z') || utcStr.includes('+') ? utcStr : utcStr + 'Z');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', { timeZone: tz, ...opts });
  } catch {
    // Bad tz — fall back to browser local
    return new Date(utcStr).toLocaleString('en-US', opts);
  }
}
