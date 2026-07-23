import { format, parse, addMinutes, isBefore, isEqual } from 'date-fns';

// Generate all 30-min slots between open and close, excluding the final slot
// if there isn't enough time for the service duration.
export function generateSlots(
  openTime: string,    // "HH:mm"
  closeTime: string,   // "HH:mm"
  durationMinutes: number,
  bookedSlots: string[],  // "HH:mm" strings already taken
): string[] {
  const base = new Date(2000, 0, 1); // arbitrary fixed date
  const open  = parse(openTime,  'HH:mm', base);
  const close = parse(closeTime, 'HH:mm', base);

  const slots: string[] = [];
  let cursor = open;

  while (isBefore(addMinutes(cursor, durationMinutes), close) || isEqual(addMinutes(cursor, durationMinutes), close)) {
    const slotStr = format(cursor, 'HH:mm');
    if (!bookedSlots.includes(slotStr)) {
      slots.push(slotStr);
    }
    cursor = addMinutes(cursor, 30);
  }

  return slots;
}

// Format a time string "HH:mm" to "h:mm a" for display
export function formatTime(time: string): string {
  const base = parse(time, 'HH:mm', new Date());
  return format(base, 'h:mm a');
}

// Format a date string "YYYY-MM-DD" to "EEE, d MMM yyyy"
export function formatDate(date: string): string {
  const d = parse(date, 'yyyy-MM-dd', new Date());
  return format(d, 'EEE, d MMM yyyy');
}
