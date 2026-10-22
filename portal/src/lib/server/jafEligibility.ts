/**
 * Who may see and apply to a JAF.
 *
 * This follows the placement portal's rules. A student has a major (and optionally a minor)
 * programme with a CPI for each, and a JAF lists `eligible_programmes`: per programme, whether
 * it is open to majors / minors and the minimum CPI for each. A student qualifies when:
 *
 *   1. their major (or minor) programme is allowed by the JAF and their CPI for it is at least the
 *      cut-off (a 0.05 tolerance is allowed, as in the placement portal);
 *   2. they meet the minimum Class X / Class XII percentage, if the JAF sets one;
 *   3. they have no active backlogs, unless the JAF allows backlogs.
 *
 * JAFs created before programmes existed only have a department list (`eligibility`); those are
 * still honoured by matching the student's department/discipline name and CPI cut-off.
 */
import Programme from './models/Programme';
import { ensureProgrammes } from './seedProgrammes';

// Same tolerance the placement portal applies when comparing CPI with a cut-off.
const CPI_TOLERANCE = 0.05;

/** Student fields needed to evaluate eligibility; use as a Mongoose .select() string. */
export const ELIGIBILITY_STUDENT_FIELDS =
  'academic_details major minor major_cpi minor_cpi schooling backlogs';

type ProgrammeDoc = {
  _id: unknown;
  programme?: string;
  discipline?: string;
  department?: string;
  major?: boolean;
  minor?: boolean;
};

export type ProgrammeIndex = { all: ProgrammeDoc[] };

type Criterion = { allowed?: boolean; cpi_cutoff?: number | null };

type JobLike = {
  eligibility?: Array<{ department?: unknown; programme?: unknown; cpiCutoff?: unknown }>;
  eligible_programmes?: Array<{ programme?: unknown; major?: Criterion; minor?: Criterion }>;
  academicEligibility?: { tenthPercentage?: number; twelfthPercentage?: number };
  allowBacklog?: boolean;
};

type StudentLike = {
  academic_details?: {
    major_department?: unknown;
    major_discipline?: unknown;
    major_programme?: unknown;
    minor_department?: unknown;
    minor_discipline?: unknown;
    minor_programme?: unknown;
  };
  major?: unknown;
  minor?: unknown;
  major_cpi?: number;
  minor_cpi?: number;
  schooling?: { x_percentage?: number; xii_percentage?: number };
  backlogs?: number;
};

function normalise(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
    : '';
}

// "Ph.D.", "PhD" and "ph d" are the same programme.
function programmeKey(value: unknown): string {
  return normalise(value).replace(/[^a-z0-9]/g, '');
}

const idOf = (value: unknown): string => {
  if (value && typeof value === 'object' && '_id' in value) return String((value as { _id: unknown })._id);
  return value == null ? '' : String(value);
};

/** Loads the programme list once so many students/JAFs can be evaluated without more queries. */
export async function loadProgrammeIndex(): Promise<ProgrammeIndex> {
  await ensureProgrammes();
  return { all: await Programme.find({}).select('programme discipline department major minor').lean() as ProgrammeDoc[] };
}

function findProgramme(index: ProgrammeIndex, programme: unknown, names: unknown[]): string | null {
  const wanted = names.map(normalise).filter(Boolean);
  if (!wanted.length) return null;
  const degree = programmeKey(programme) || programmeKey('Ph.D.');
  const match = index.all.find((item) =>
    programmeKey(item.programme) === degree &&
    (wanted.includes(normalise(item.discipline)) || wanted.includes(normalise(item.department))));
  return match ? idOf(match._id) : null;
}

/** The student's major/minor programme ids: the stored reference, else matched by name. */
export function resolveStudentProgrammes(student: StudentLike, index: ProgrammeIndex) {
  const academic = student.academic_details || {};
  const majorId = student.major
    ? idOf(student.major)
    : findProgramme(index, academic.major_programme, [academic.major_discipline, academic.major_department]);
  const minorId = student.minor
    ? idOf(student.minor)
    : findProgramme(index, academic.minor_programme, [academic.minor_discipline, academic.minor_department]);
  return { majorId, minorId };
}

/** Returns the canonical, display-ready department names selected in a legacy JAF. */
export function selectedProgrammeNames(job: JobLike): string[] {
  const names = (job.eligibility || [])
    .map((criterion) => criterion.department ?? criterion.programme)
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .map((name) => name.trim());

  return [...new Set(names)];
}

/** Legacy check: a selected department matches the student's recorded major. */
export function isStudentInEligibleProgramme(job: JobLike, student: StudentLike): boolean {
  const selected = new Set(selectedProgrammeNames(job).map(normalise));
  if (!selected.size) return false;

  const academic = student.academic_details || {};
  return [academic.major_department, academic.major_discipline, academic.major_programme]
    .map(normalise)
    .some((programme) => programme.length > 0 && selected.has(programme));
}

export type EligibilityResult = { eligible: boolean; reasons: string[] };

export function evaluateJafEligibility(job: JobLike, student: StudentLike, index: ProgrammeIndex): EligibilityResult {
  const reasons: string[] = [];

  // Class X / XII percentage cut-offs, if the company set any.
  const tenth = Number(job.academicEligibility?.tenthPercentage) || 0;
  if (tenth > 0 && (Number(student.schooling?.x_percentage) || 0) < tenth) {
    reasons.push(`Requires at least ${tenth}% in Class X (add your Class X percentage in your profile).`);
  }
  const twelfth = Number(job.academicEligibility?.twelfthPercentage) || 0;
  if (twelfth > 0 && (Number(student.schooling?.xii_percentage) || 0) < twelfth) {
    reasons.push(`Requires at least ${twelfth}% in Class XII (add your Class XII percentage in your profile).`);
  }

  // Backlogs.
  if ((Number(student.backlogs) || 0) > 0 && !job.allowBacklog) {
    reasons.push('This role does not accept candidates with active backlogs.');
  }

  // Programme and CPI.
  const majorCpi = Number(student.major_cpi) || 0;
  const minorCpi = Number(student.minor_cpi) || 0;
  const rows = job.eligible_programmes || [];

  if (rows.length) {
    const { majorId, minorId } = resolveStudentProgrammes(student, index);
    let programmeOpen = false;
    let cpiMet = false;
    for (const row of rows) {
      const programmeId = idOf(row.programme);
      if (majorId && programmeId === majorId && row.major?.allowed) {
        programmeOpen = true;
        if (row.major.cpi_cutoff == null || majorCpi + CPI_TOLERANCE >= row.major.cpi_cutoff) cpiMet = true;
      }
      if (minorId && programmeId === minorId && row.minor?.allowed) {
        programmeOpen = true;
        if (row.minor.cpi_cutoff == null || minorCpi + CPI_TOLERANCE >= row.minor.cpi_cutoff) cpiMet = true;
      }
    }
    if (!majorId && !minorId) reasons.push('Your programme could not be identified from your profile. Please contact CCD.');
    else if (!programmeOpen) reasons.push('Your programme is not eligible for this role.');
    else if (!cpiMet) reasons.push('Your CPI is below the cut-off for your programme.');
  } else {
    // JAF created before programmes existed: match the department list.
    const academic = student.academic_details || {};
    const names = [academic.major_department, academic.major_discipline, academic.major_programme].map(normalise).filter(Boolean);
    const matching = (job.eligibility || []).filter((criterion) =>
      names.includes(normalise(criterion.department ?? criterion.programme)));
    if (!matching.length) reasons.push('Your programme is not eligible for this role.');
    else if (!matching.some((criterion) => majorCpi + CPI_TOLERANCE >= (Number(criterion.cpiCutoff) || 0))) {
      reasons.push('Your CPI is below the cut-off for your programme.');
    }
  }

  return { eligible: reasons.length === 0, reasons };
}
