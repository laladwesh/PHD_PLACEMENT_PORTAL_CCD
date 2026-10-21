/**
 * The JAF form calls these values "programmes", while student records store
 * them as a major department/discipline.  Keep that translation in one place
 * so list, detail, and application access cannot drift apart.
 */

type JobLike = {
  eligibility?: Array<{ department?: unknown; programme?: unknown; cpiCutoff?: unknown }>;
};

type StudentLike = {
  academic_details?: {
    major_department?: unknown;
    major_discipline?: unknown;
    major_programme?: unknown;
  };
};

function normalise(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
    : '';
}

/** Returns the canonical, display-ready programme names selected in a JAF. */
export function selectedProgrammeNames(job: JobLike): string[] {
  const names = (job.eligibility || [])
    .map((criterion) => criterion.department ?? criterion.programme)
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .map((name) => name.trim());

  return [...new Set(names)];
}

/**
 * A scholar can view a JAF only when one selected programme matches their
 * recorded major.  `major_programme` is included for data imported from older
 * records; current JAF options map primarily to department/discipline.
 */
export function isStudentInEligibleProgramme(job: JobLike, student: StudentLike): boolean {
  const selected = new Set(selectedProgrammeNames(job).map(normalise));
  if (!selected.size) return false;

  const academic = student.academic_details || {};
  return [academic.major_department, academic.major_discipline, academic.major_programme]
    .map(normalise)
    .some((programme) => programme.length > 0 && selected.has(programme));
}
