import mongoose from 'mongoose';
import Programme from './models/Programme';

type Rule = { allowed: boolean; cpi_cutoff: number };
export type EligibleProgrammeRow = { programme: mongoose.Types.ObjectId; major: Rule; minor: Rule };

/**
 * Validates the eligibility the JAF form submits (one entry per programme with a major and a minor
 * rule) against the programmes collection. A programme can only be allowed as a major/minor if it
 * offers that. Returns the rows to store, plus the department list older screens still read.
 */
export async function buildEligibleProgrammes(input: unknown): Promise<
  | { error: string }
  | { rows: EligibleProgrammeRow[]; legacy: Array<{ department: string; cpiCutoff: number }> }
> {
  if (!Array.isArray(input)) return { error: 'Eligible programmes must be a list.' };

  const entries = input as Array<{ programme?: unknown; major?: Partial<Rule>; minor?: Partial<Rule> }>;
  if (entries.some((entry) => !mongoose.isValidObjectId(entry?.programme))) {
    return { error: 'Eligible programmes are invalid.' };
  }

  const ids = [...new Set(entries.map((entry) => String(entry.programme)))];
  const programmes = await Programme.find({ _id: { $in: ids } }).select('programme discipline major minor').lean() as Array<{
    _id: mongoose.Types.ObjectId; discipline?: string; major?: boolean; minor?: boolean;
  }>;
  const byId = new Map(programmes.map((programme) => [String(programme._id), programme]));
  if (byId.size !== ids.length) return { error: 'One or more selected programmes no longer exist.' };

  const cutoff = (value: unknown): number | null => {
    if (value === undefined || value === null || value === '') return 0;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && number <= 10 ? number : null;
  };

  const rows: EligibleProgrammeRow[] = [];
  for (const entry of entries) {
    const programme = byId.get(String(entry.programme))!;
    const majorCutoff = cutoff(entry.major?.cpi_cutoff);
    const minorCutoff = cutoff(entry.minor?.cpi_cutoff);
    if (majorCutoff === null || minorCutoff === null) return { error: 'CPI cut-offs must be between 0 and 10.' };

    const major = { allowed: Boolean(entry.major?.allowed) && Boolean(programme.major), cpi_cutoff: majorCutoff };
    const minor = { allowed: Boolean(entry.minor?.allowed) && Boolean(programme.minor), cpi_cutoff: minorCutoff };
    if (major.allowed || minor.allowed) rows.push({ programme: programme._id, major, minor });
  }
  if (!rows.length) return { error: 'Select at least one eligible programme.' };

  // Legacy department list: lowest cut-off per department name.
  const legacyByDepartment = new Map<string, number>();
  for (const row of rows) {
    const name = byId.get(String(row.programme))?.discipline || '';
    const cutoffs = [row.major.allowed ? row.major.cpi_cutoff : null, row.minor.allowed ? row.minor.cpi_cutoff : null]
      .filter((value): value is number => value !== null);
    if (!name || !cutoffs.length) continue;
    legacyByDepartment.set(name, Math.min(legacyByDepartment.get(name) ?? Infinity, ...cutoffs));
  }
  const legacy = [...legacyByDepartment].map(([department, cpiCutoff]) => ({ department, cpiCutoff }));
  return { rows, legacy };
}
