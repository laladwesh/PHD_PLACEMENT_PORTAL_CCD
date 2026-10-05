// Keep legacy imports on the single connection implementation.  Having two
// defaults previously made different route families read different databases.
export { connectToDatabase } from '@/lib/mongodb';
export { default } from '@/lib/mongodb';
