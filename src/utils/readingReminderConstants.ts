// Stable identifiers for locally-scheduled reading reminder notifications.
// Use these constants (not magic strings) wherever notifications are scheduled or cancelled.

/** One-time 11pm nudge: fires if no reading logged today. Cancelled on successful read log. */
export const NIGHTLY_NUDGE_ID = 'biblo-nightly-reading-nudge';

/** Daily repeating reminder at the user's preferred time. */
export const PREFERRED_REMINDER_ID = 'biblo-preferred-reading-reminder';
