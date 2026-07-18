// Coordinator access window: Monday–Saturday, 07:00–13:30 India time (IST),
// regardless of the device's own timezone.
export function coordinatorWindowOpen(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const val = (t) => parts.find((p) => p.type === t)?.value;
  const mins = parseInt(val('hour'), 10) * 60 + parseInt(val('minute'), 10);
  return val('weekday') !== 'Sun' && mins >= 7 * 60 && mins <= 13 * 60 + 30;
}
