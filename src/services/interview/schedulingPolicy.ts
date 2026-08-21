export function intervalEnd(start: Date, durationMin: number) {
  return new Date(start.getTime() + durationMin * 60_000);
}

export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function validInterviewDuration(durationMin: number) {
  return Number.isInteger(durationMin) && durationMin >= 15 && durationMin <= 240;
}
