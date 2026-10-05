// The application previously had two incompatible Student schemas.  Export
// the canonical model so every API route reads and writes the same documents.
export { default } from '@/lib/server/models/Student';
