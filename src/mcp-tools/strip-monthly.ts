/**
 * Strip the 13-month history arrays the API attaches to every keyword row
 * (search_data.monthly_searches, opportunity.additional_monthly_sessions).
 * They dominate list payloads (~60-80% of bytes on keyword listings) and are
 * rarely what the caller asked for — same treatment as the AIO content field:
 * removed by default, restored with include_monthly_searches=true.
 * Mutates in place and returns the same value for call-site convenience.
 */
export function stripMonthlySeries(value: any): any {
  if (Array.isArray(value)) {
    for (const item of value) stripMonthlySeries(item);
    return value;
  }
  if (value && typeof value === 'object') {
    delete value.monthly_searches;
    delete value.additional_monthly_sessions;
    for (const key of Object.keys(value)) stripMonthlySeries(value[key]);
  }
  return value;
}
