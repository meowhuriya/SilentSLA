import { SLAPolicy, Incident } from '@prisma/client';

export function calculateAllowedDowntimeMinutes(
  availabilityTarget: number,
  measurementPeriodStr: string,
  currentDate: Date
): number {
  let totalMinutes = 0;
  
  if (measurementPeriodStr.toUpperCase() === 'MONTHLY') {
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    // Get number of days in the current month using UTC
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    totalMinutes = daysInMonth * 24 * 60;
  } else {
    // Default fallback to 30 days
    totalMinutes = 30 * 24 * 60;
  }

  // target is something like 99.9 (percent)
  const downtimeFraction = 1 - (availabilityTarget / 100);
  return totalMinutes * downtimeFraction;
}

export function evaluateBreach(
  policy: SLAPolicy,
  incidents: Incident[],
  currentDate: Date
): { isBreach: boolean; totalDowntimeMinutes: number; allowedDowntimeMinutes: number } {
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();

  const windowIncidents = incidents.filter(inc => {
    // Simplified: check if incident started in the current month window
    return inc.startTime.getUTCFullYear() === year && inc.startTime.getUTCMonth() === month;
  });

  const totalDowntimeMinutes = windowIncidents.reduce((sum, inc) => {
    if (inc.isExcluded) return sum;
    return sum + (inc.durationMinutes || 0);
  }, 0);

  const allowedDowntimeMinutes = calculateAllowedDowntimeMinutes(
    policy.availabilityTarget,
    policy.measurementPeriod,
    currentDate
  );

  return {
    isBreach: totalDowntimeMinutes > allowedDowntimeMinutes,
    totalDowntimeMinutes,
    allowedDowntimeMinutes
  };
}
