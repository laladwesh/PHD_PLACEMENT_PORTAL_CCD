'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserRole } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

const programmes = [
  'Biosciences and Bioengineering', 'Chemical Engineering', 'Chemistry', 'Civil Engineering',
  'Computer Science and Engineering', 'Design', 'Electronics and Electrical Engineering',
  'Humanities and Social Sciences', 'Mathematics', 'Mechanical Engineering', 'Physics',
  'Intelligent Cyber Physical Systems', 'Disaster Management and Research', 'Environment',
  'Energy', 'Nanotechnology', 'Rural Technology', 'Linguistic Science and Technology',
  'Agro and Rural Technology', 'Indian Knowledge Systems', 'Business'
];

const termsAndConditions = [
  "The confirmation link sent to the company's/HR's registered email ID upon JAF submission must be clicked to acknowledge these terms and conditions. Until this confirmation is received, the JAF will not be visible for candidates to apply.",
  "All processes — uploading shortlists, Online Assessment (OA) candidate lists, interview lists, and final selections — must be carried out on this intern portal. No off-portal lists will be processed. Under exceptional cases, information of the shortlist/interview list via email is acceptable, but without uploading them in the portal, OA list generation, exam hall information, and candidate intimation in their respective emails will not happen.",
  "Every student list submitted to the intern portal (resume shortlist, OA list, interview shortlist, or final selection) must include the student's roll number or institute email ID. These are the only identifiers used to uniquely match students in the portal.",
  "The list of candidates shortlisted for the OA must be uploaded to the portal at least 24 hours before the scheduled OA so that the logistics team can arrange rooms, invigilators, and other facilities. Delay in this process will lead to rescheduling of the OA.",
  "The list of candidates shortlisted for interviews must be uploaded to the portal at least 12 hours before the scheduled interview slot for logistics arrangements. Delay in this process will lead to rescheduling of the interviews.",
  "The list of finally selected candidates must be declared on the portal, preferably within 24 hours of completing the interviews. Once declared, CCD will move those students out of the active internship recruitment process if they satisfy the internship drive recruitment guidelines and preference policies.",
  "Final offer letters for finally selected students must be sent to the candidates before 31.12.2026. Any delay in this has to be communicated to CCD in formal email.",
  "Offers extended to selected candidates should be honored within the timelines agreed upon with CCD, IIT Guwahati. Offers should not be withdrawn, revoked, or altered after the candidate has accepted, except as mutually agreed in writing.",
  "Your organization will adhere to the internship policy of IIT Guwahati, including the one-student-one-offer rule and the specific slot/day assigned for your process.",
  "All stipend details, role responsibilities, joining date, location, bond or service-contract terms, and other particulars stated in this JAF and later in the detailed offer letter should be accurate and binding. Any modification after submission requires written approval from CCD, IIT Guwahati.",
  "Student data obtained through this process should be used solely for this internship recruitment drive and should not be shared with any third party.",
  "CCD, IIT Guwahati, reserves the right to defer or cancel your recruitment drive and release the candidates blocked by final selection if any of these terms are not adhered to.",
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[44px] items-center rounded-full transition-colors ${
        checked ? 'bg-[#1B2A4A]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[24px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

type TabKey = 'job' | 'eligibility' | 'salary' | 'selection' | 'bond' | 'additional';

function JAFFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { isStudent, isCoordinator } = useUserRole();
  const [activeTab, setActiveTab] = useState<TabKey>('job');
  const [completedTabs, setCompletedTabs] = useState<TabKey[]>([]);
  const [jafId, setJafId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tab 1 - Job Details
  const [designation, setDesignation] = useState('');
  const [descType, setDescType] = useState<'html' | 'file'>('html');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescFile, setJobDescFile] = useState('');
  const [isUploadingJobDesc, setIsUploadingJobDesc] = useState(false);
  const [placeOfPosting, setPlaceOfPosting] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [expectedRecruitments, setExpectedRecruitments] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Tab 2 - Eligibility
  const [eligibility, setEligibility] = useState(
    programmes.map((p) => ({ programme: p, selected: false, cpiCutoff: 0 }))
  );
  const [tenthPercentage, setTenthPercentage] = useState<number | ''>('');
  const [twelfthPercentage, setTwelfthPercentage] = useState<number | ''>('');
  const [bachelorsCPI, setBachelorsCPI] = useState<number | ''>('');
  const [mastersCPI, setMastersCPI] = useState<number | ''>('');
  const [allowBacklog, setAllowBacklog] = useState(false);

  // Tab 3 - Salary
  const [currency, setCurrency] = useState('INR');
  const [salaryStructureFile, setSalaryStructureFile] = useState('');
  const [isUploadingSalaryFile, setIsUploadingSalaryFile] = useState(false);
  const [sameCTC, setSameCTC] = useState<number | ''>('');
  const [sameBase, setSameBase] = useState<number | ''>('');
  const [sameMonthly, setSameMonthly] = useState<number | ''>('');
  const [compensations, setCompensations] = useState(
    programmes.map((p) => ({ programme: p, ctc: 0, base: 0, monthlyFixed: 0 }))
  );
  const [oneTimeBonus, setOneTimeBonus] = useState<number | ''>('');
  const [accommodation, setAccommodation] = useState(false);
  const [ppoExtension, setPpoExtension] = useState(false);
  const [additionalSalaryInfo, setAdditionalSalaryInfo] = useState('');

  // Tab 4 - Selection Process
  const [ppt, setPpt] = useState(true);
  const [shortlistResume, setShortlistResume] = useState(true);
  const [writtenTest, setWrittenTest] = useState(false);
  const [testRequirements, setTestRequirements] = useState('');
  const [inPerson, setInPerson] = useState(true);
  const [telephonic, setTelephonic] = useState(false);
  const [videoConferencing, setVideoConferencing] = useState(false);
  const [groupDiscussion, setGroupDiscussion] = useState(false);
  const [preInterviewGD, setPreInterviewGD] = useState(false);
  const [medicalTest, setMedicalTest] = useState(false);
  const [testDuration, setTestDuration] = useState('');
  const [interviewDuration, setInterviewDuration] = useState('');

  // Tab 5 - Bond Contract
  const [bondDocumentFile, setBondDocumentFile] = useState('');
  const [isUploadingBondFile, setIsUploadingBondFile] = useState(false);
  const [bondDurationYears, setBondDurationYears] = useState<number | ''>('');
  const [bondDurationMonths, setBondDurationMonths] = useState<number | ''>('');
  const [bondDetailsText, setBondDetailsText] = useState('');

  // Tab 6 - Additional
  const [additionalTitle, setAdditionalTitle] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'job', label: 'Job Details' },
    { key: 'eligibility', label: 'Eligibility Criteria' },
    { key: 'salary', label: 'Salary Details' },
    { key: 'selection', label: 'Selection Process' },
    { key: 'bond', label: 'Bond Contract' },
    { key: 'additional', label: 'Additional details' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string, setUrl: (url: string) => void, setLoading: (b: boolean) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    try {
      const res = await fetch('/phdplacement/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUrl(data.url);
      toast.success('File uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editId) {
      setJafId(editId);
      fetch(`/phdplacement/api/jaf/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.job) {
            const job = data.job;
            if (job.jobDesignation) setDesignation(job.jobDesignation);
            if (job.jobDescription) {
              setDescType(job.jobDescription.mode === 'file' ? 'file' : 'html');
              setJobDescription(job.jobDescription.content || '');
              if (job.jobDescription.fileUrl) setJobDescFile(job.jobDescription.fileUrl);
            }
            if (job.placeOfPosting) setPlaceOfPosting(job.placeOfPosting);
            if (job.dateOfJoining) setDateOfJoining(job.dateOfJoining);
            if (job.numOpenings) setExpectedRecruitments(job.numOpenings.toString());

            if (job.academicEligibility) {
              setTenthPercentage(job.academicEligibility.tenthPercentage ?? '');
              setTwelfthPercentage(job.academicEligibility.twelfthPercentage ?? '');
              setBachelorsCPI(job.academicEligibility.bachelorsCPI ?? '');
              setMastersCPI(job.academicEligibility.mastersCPI ?? '');
            }
            if (job.allowBacklog !== undefined) setAllowBacklog(job.allowBacklog);

            if (job.eligibility && job.eligibility.length > 0) {
              setEligibility((prev) => {
                const updated = [...prev];
                job.eligibility.forEach((e: any) => {
                  const el = updated.find((item) => item.programme === e.department);
                  if (el) {
                    el.selected = true;
                    el.cpiCutoff = e.cpiCutoff || 0;
                  }
                });
                return updated;
              });
            }

            if (job.salary) {
              if (job.salary.currency) setCurrency(job.salary.currency);
              if (job.salary.salaryStructureFile) setSalaryStructureFile(job.salary.salaryStructureFile);
              setOneTimeBonus(job.salary.oneTimeBonus ?? '');
              setAccommodation(job.salary.accommodationAvailable || false);
              setPpoExtension(job.salary.ppoExtension || false);
              setAdditionalSalaryInfo(job.salary.additionalInfo || '');
              if (job.salary.programmes && job.salary.programmes.length > 0) {
                setCompensations((prev) => {
                  const updatedComp = [...prev];
                  job.salary.programmes.forEach((p: any) => {
                    const comp = updatedComp.find((item) => item.programme === p.programme);
                    if (comp) {
                      comp.ctc = p.ctc ?? p.amount ?? 0;
                      comp.base = p.base ?? 0;
                      comp.monthlyFixed = p.monthlyFixed ?? 0;
                    }
                  });
                  return updatedComp;
                });
              }
            }

            if (job.selectionProcess) {
              setPpt(job.selectionProcess.ppt ?? true);
              setShortlistResume(job.selectionProcess.resumeShortlist ?? true);
              setWrittenTest(job.selectionProcess.writtenTest ?? false);
              setTestRequirements(job.selectionProcess.notes || '');
              setInPerson(job.selectionProcess.technicalInterview ?? true);
              setGroupDiscussion(job.selectionProcess.groupDiscussion ?? false);
              setPreInterviewGD(job.selectionProcess.preInterviewGD ?? false);
              setMedicalTest(job.selectionProcess.medicalTest ?? false);
              setTestDuration(job.selectionProcess.testDuration || '');
              setInterviewDuration(job.selectionProcess.interviewDuration || '');
            }

            if (job.bondDetails) {
              setBondDurationYears(job.bondDetails.durationYears ?? '');
              setBondDurationMonths(job.bondDetails.durationMonths ?? '');
              setBondDetailsText(job.bondDetails.description ?? '');
              if (job.bondDetails.documentUrl) setBondDocumentFile(job.bondDetails.documentUrl);
            }

            if (job.additionalRequirements && job.additionalRequirements.length > 0) {
              setAdditionalTitle(job.additionalRequirements[0].title || '');
              setAdditionalDescription(job.additionalRequirements[0].description || '');
            }
            if (job.agreedToTerms) setAgreedTerms(job.agreedToTerms);
          }
        })
        .catch((err) => console.error('Failed to load JAF', err));
    }
  }, [editId]);

  const tabOrder: TabKey[] = ['job', 'eligibility', 'salary', 'selection', 'bond', 'additional'];

  const saveTabToBackend = async (tabName: string, data: any) => {
    setIsSaving(true);
    try {
      let id = jafId;
      if (!id) {
        // Create new draft
        const res = await fetch('/phdplacement/api/jaf', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to create JAF');
        const json = await res.json();
        id = json.job._id;
        setJafId(id);
      }
      
      const updateRes = await fetch(`/phdplacement/api/jaf/${id}/${tabName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!updateRes.ok) throw new Error('Failed to update tab');
      
      // Update local state
      if (!completedTabs.includes(activeTab)) {
        setCompletedTabs([...completedTabs, activeTab]);
      }
      const currentTabObj = tabs.find((t) => t.key === activeTab);
      if (tabName !== 'additional') {
        toast.success(`${currentTabObj ? currentTabObj.label : 'Section'} saved.`);
      }
      
      const idx = tabOrder.indexOf(activeTab);
      if (idx < tabOrder.length - 1) {
        setActiveTab(tabOrder[idx + 1]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const validateCurrentTab = () => {
    if (activeTab === 'job') {
      if (!designation.trim()) return 'Job Designation is required';
      if (descType === 'html' && !jobDescription.trim()) return 'Job Description is required';
      if (descType === 'file' && !jobDescFile) return 'Job Description file is required';
      if (!placeOfPosting.trim()) return 'Place of Posting is required';
      if (!expectedRecruitments) return 'Expected number of Recruitments is required';
    } else if (activeTab === 'salary') {
      if (!currency) return 'Currency is required';
    } else if (activeTab === 'additional') {
      if (!additionalDescription.trim()) return 'Description of the additional details is required';
    }
    return null; // No errors
  };

  const handleSaveTab = async () => {
    const errorMsg = validateCurrentTab();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    if (activeTab === 'job') {
      await saveTabToBackend('job-details', {
        jobDesignation: designation,
        jobDescription: {
          mode: descType,
          content: descType === 'html' ? jobDescription : '',
          fileUrl: descType === 'file' ? jobDescFile : ''
        },
        placeOfPosting: placeOfPosting,
        dateOfJoining: dateOfJoining,
        numOpenings: parseInt(expectedRecruitments) || 0,
      });
    } else if (activeTab === 'eligibility') {
      await saveTabToBackend('eligibility', {
        eligibility: eligibility.filter(e => e.selected).map(e => ({
          department: e.programme,
          cpiCutoff: e.cpiCutoff
        })),
        academicEligibility: {
          tenthPercentage: tenthPercentage ? Number(tenthPercentage) : undefined,
          twelfthPercentage: twelfthPercentage ? Number(twelfthPercentage) : undefined,
          bachelorsCPI: bachelorsCPI ? Number(bachelorsCPI) : undefined,
          mastersCPI: mastersCPI ? Number(mastersCPI) : undefined,
        },
        allowBacklog
      });
    } else if (activeTab === 'salary') {
      await saveTabToBackend('salary', {
        salary: {
          currency,
          salaryStructureFile,
          oneTimeBonus: oneTimeBonus ? Number(oneTimeBonus) : undefined,
          accommodationAvailable: accommodation,
          ppoExtension,
          additionalInfo: additionalSalaryInfo,
          programmes: compensations.filter(c => c.ctc > 0 || c.base > 0).map(c => ({
            programme: c.programme,
            ctc: c.ctc,
            base: c.base,
            monthlyFixed: c.monthlyFixed
          }))
        }
      });
    } else if (activeTab === 'selection') {
      await saveTabToBackend('selection', {
        selectionProcess: {
          ppt,
          shortlistResume,
          writtenTest,
          notes: testRequirements,
          technicalInterview: inPerson,
        }
      });
    } else if (activeTab === 'bond') {
      await saveTabToBackend('bond', {
        bondDetails: {
          hasBond: true,
          durationYears: bondDurationYears ? Number(bondDurationYears) : undefined,
          durationMonths: bondDurationMonths ? Number(bondDurationMonths) : undefined,
          description: bondDetailsText,
          documentUrl: bondDocumentFile
        }
      });
    } else if (activeTab === 'additional') {
      await saveTabToBackend('additional', {
        additionalRequirements: [
          { title: additionalTitle, description: additionalDescription }
        ],
        agreedToTerms: agreedTerms
      });
      
      if (agreedTerms) {
        toast.success('Job Application Form submitted successfully!');
        router.push('/jobs');
      }
    }
  };

  const applyToAllProgrammes = () => {
    setCompensations(compensations.map(c => {
      const isEligible = eligibility.find(e => e.programme === c.programme)?.selected;
      if (!isEligible) return c;

      return {
        ...c,
        ctc: sameCTC !== '' ? Number(sameCTC) : c.ctc,
        base: sameBase !== '' ? Number(sameBase) : c.base,
        monthlyFixed: sameMonthly !== '' ? Number(sameMonthly) : c.monthlyFixed,
      };
    }));
    toast.success('Applied to eligible programmes.');
  };

  if (isCoordinator || isStudent) {
    return (
      <DashboardLayout>
        <div className="bg-white p-8 rounded-xl border border-gray-200/80 text-center max-w-xl mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">
            {isCoordinator ? 'JAF Creation Restricted for Coordinators' : 'Job Application Form Unavailable'}
          </h2>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            {isCoordinator
              ? 'Job Application Forms (JAFs) are submitted directly by recruiting organizations. Placement coordinators review, moderate, and approve JAFs from the Job Applications console.'
              : 'Job application forms are not accessible in the scholar portal.'}
          </p>
          <button
            type="button"
            onClick={() => router.push(isCoordinator ? '/jobs' : '/dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B2A4A] text-white rounded-lg text-xs font-semibold hover:bg-[#2D3F5E] transition-colors cursor-pointer"
          >
            <span>&larr; Back to {isCoordinator ? 'Job Applications' : 'Dashboard'}</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900">Job Application Form</h1>
      <p className="text-sm text-red-600 mt-1">* Save your data by clicking the bottom button on each page.</p>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 mt-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (!jafId && tab.key !== 'job') {
                toast.error('Please complete and confirm the Job Details section first to create the JAF.');
                return;
              }
              setActiveTab(tab.key);
            }}
            className={`py-3 px-6 text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-[#1B2A4A] font-semibold border-b-[3px] border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {completedTabs.includes(tab.key) && (
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 mt-4 rounded">

        {/* Tab 1 - Job Details */}
        {activeTab === 'job' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Job Designation <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Describe the job in short"
                className="w-[500px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Job Description <span className="text-red-500">*</span></label>
              
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={descType === 'html'}
                  onChange={() => setDescType('html')}
                  className="mt-1 accent-blue-600"
                />
                <div className="flex-1 max-w-[500px]">
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <div className="flex gap-1 p-2 border-b border-gray-200 bg-white">
                      <button type="button" className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded">B</button>
                      <button type="button" className="px-2 py-1 text-sm italic hover:bg-gray-100 rounded">I</button>
                      <button type="button" className="px-2 py-1 text-sm underline hover:bg-gray-100 rounded">U</button>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Enter Job Description"
                      rows={5}
                      className="w-full p-3 text-sm focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm font-bold text-center my-3 max-w-[540px]">OR</p>

              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={descType === 'file'}
                  onChange={() => setDescType('file')}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <span className="text-sm font-bold">Upload PDF</span>
                  <span className="text-sm text-gray-400 ml-1">(File size Limit : 10MB)</span>
                  <div className="mt-2 flex items-center gap-4">
                    <label className="bg-gray-500 text-white text-sm px-4 py-1.5 rounded hover:bg-gray-600 transition-colors cursor-pointer inline-flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isUploadingJobDesc ? 'Uploading...' : 'Upload'}
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'job-desc', setJobDescFile, setIsUploadingJobDesc)} />
                    </label>
                    {jobDescFile && <a href={jobDescFile} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs">{jobDescFile.split('/').pop()}</a>}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Place of Posting <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={placeOfPosting}
                onChange={(e) => setPlaceOfPosting(e.target.value)}
                placeholder="Mention the Place of Posting"
                className="w-[500px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Date of Joining</label>
              <input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                placeholder="Enter Date of Joining"
                className="w-[350px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Expected number of Recruitments <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={expectedRecruitments}
                onChange={(e) => setExpectedRecruitments(e.target.value)}
                placeholder="Enter Expected number of recruitments"
                className="w-[350px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <button
              onClick={() => {
                const errorMsg = validateCurrentTab();
                if (errorMsg) {
                  toast.error(errorMsg);
                  return;
                }
                if (!jafId) {
                  setShowConfirmModal(true);
                } else {
                  handleSaveTab();
                }
              }}
              disabled={isSaving}
              className="bg-[#1B2A4A] text-white text-sm px-5 py-2 rounded font-medium hover:bg-[#2D3F5E] transition-colors mt-4"
            >
              {!jafId ? 'Create New JAF' : isSaving ? 'Saving...' : 'Save & Next'}
            </button>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <div className="bg-white rounded-md shadow-xl w-full max-w-md p-6 relative">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm JAF</h2>
              <p className="text-sm text-gray-600 mb-6">Do you want to create New Job Application Form?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSaveTab();
                  }}
                  className="px-4 py-2 bg-[#1B2A4A] text-white rounded text-sm hover:bg-[#2D3F5E]"
                >
                  Confirm New JAF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 - Eligibility Criteria */}
        {activeTab === 'eligibility' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Academic Eligibility cut-offs (if any)</h3>
              <div className="grid grid-cols-2 max-w-[600px] gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">10th Percentage</label>
                  <input type="number" value={tenthPercentage} onChange={(e) => setTenthPercentage(e.target.value ? Number(e.target.value) : '')} placeholder="%" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#1B2A4A] text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">12th Percentage</label>
                  <input type="number" value={twelfthPercentage} onChange={(e) => setTwelfthPercentage(e.target.value ? Number(e.target.value) : '')} placeholder="%" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#1B2A4A] text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Bachelor's CPI</label>
                  <input type="number" value={bachelorsCPI} onChange={(e) => setBachelorsCPI(e.target.value ? Number(e.target.value) : '')} placeholder="CPI out of 10" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#1B2A4A] text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Master's CPI</label>
                  <input type="number" value={mastersCPI} onChange={(e) => setMastersCPI(e.target.value ? Number(e.target.value) : '')} placeholder="CPI out of 10" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#1B2A4A] text-sm" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-700">Allow Backlogs</label>
              <Toggle checked={allowBacklog} onChange={setAllowBacklog} />
              <span className="text-sm text-gray-700">{allowBacklog ? 'Yes' : 'No'}</span>
            </div>

            <hr className="border-gray-200" />

            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">Select eligible programmes and set CPI cutoff for the role</p>
              <div className="space-y-4">
                {eligibility.map((item, idx) => (
                  <div key={item.programme} className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => {
                        const updated = [...eligibility];
                        updated[idx].selected = e.target.checked;
                        setEligibility(updated);
                      }}
                      className="w-4 h-4 accent-[#1B2A4A]"
                    />
                    <span className="text-sm text-gray-800 w-[300px]">{item.programme}</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={item.cpiCutoff}
                      onChange={(e) => {
                        const updated = [...eligibility];
                        updated[idx].cpiCutoff = Number(e.target.value);
                        setEligibility(updated);
                      }}
                      className="w-[100px] p-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
                      placeholder="CPI"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4">
              <button
                onClick={handleSaveTab}
                disabled={isSaving}
                className="bg-[#1B2A4A] text-white text-sm px-5 py-2 rounded font-medium hover:bg-[#2D3F5E] transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save and Next'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3 - Salary Details */}
        {activeTab === 'salary' && (
          <div className="space-y-6">
            <p className="text-sm font-semibold text-gray-800">Only fill salary details for programmes you will be hiring</p>

            <div className="flex gap-16 items-start">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Currency <span className="text-red-500">*</span></label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-[200px] p-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <span className="block text-sm font-bold text-gray-900 mb-1.5">Add Salary Structure as PDF</span>
                <div className="flex items-center gap-4">
                  <label className="border border-gray-300 text-sm px-4 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer inline-flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {isUploadingSalaryFile ? 'Uploading...' : 'Upload'}
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'salary', setSalaryStructureFile, setIsUploadingSalaryFile)} />
                  </label>
                  {salaryStructureFile && <a href={salaryStructureFile} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs">{salaryStructureFile.split('/').pop()}</a>}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded bg-gray-50 p-4">
              <h4 className="text-sm font-bold mb-1">Same salary for all programmes?</h4>
              <p className="text-xs text-gray-500 mb-3">Enter the figures once here and apply them to the programmes marked eligible in the Eligibility Criteria step - you can still edit any row individually afterwards.</p>
              
              <div className="flex items-end gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CTC (per annum)</label>
                  <input type="number" value={sameCTC} onChange={(e) => setSameCTC(e.target.value ? Number(e.target.value) : '')} className="w-[180px] p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1B2A4A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Base Salary (per annum)</label>
                  <input type="number" value={sameBase} onChange={(e) => setSameBase(e.target.value ? Number(e.target.value) : '')} className="w-[180px] p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1B2A4A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Fixed Salary (per month)</label>
                  <input type="number" value={sameMonthly} onChange={(e) => setSameMonthly(e.target.value ? Number(e.target.value) : '')} className="w-[200px] p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1B2A4A]" />
                </div>
                <button type="button" onClick={applyToAllProgrammes} className="bg-[#1B2A4A] text-white text-sm px-4 py-2 rounded font-medium hover:bg-[#2D3F5E] transition-colors h-[38px]">
                  Apply to All Programmes
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="p-4 font-bold border-r border-gray-200">Programme</th>
                    <th className="p-4 border-r border-gray-200">
                      <div className="font-bold">CTC (per annum)</div>
                      <div className="text-xs font-normal text-gray-500 mt-1 whitespace-normal leading-tight">Total annual compensation offered by the company, including fixed salary, variable/performance-linked pay, employer contributions, bonuses, stock/equity and other applicable compensation components.</div>
                    </th>
                    <th className="p-4 border-r border-gray-200">
                      <div className="font-bold">Base Salary (per annum)</div>
                      <div className="text-xs font-normal text-gray-500 mt-1 whitespace-normal leading-tight">Total guaranteed annual cash compensation, including Basic Salary and other fixed cash components such as HRA and allowances, but excluding variable/performance-linked pay, bonuses and stock/equity.</div>
                    </th>
                    <th className="p-4 min-w-[200px]">
                      <div className="font-bold">Monthly Fixed Salary (per month)</div>
                      <div className="text-xs font-normal text-gray-500 mt-1 whitespace-normal leading-tight">Does not cover benefits like bonus/perk/incentive, other compensation etc.</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {compensations.map((item, idx) => (
                    <tr key={item.programme} className="bg-white">
                      <td className="p-4 font-medium text-gray-900 border-r border-gray-200">{item.programme}</td>
                      <td className="p-4 border-r border-gray-200">
                        <input
                          type="number"
                          value={item.ctc}
                          onChange={(e) => {
                            const updated = [...compensations];
                            updated[idx].ctc = Number(e.target.value);
                            setCompensations(updated);
                          }}
                          className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-4 border-r border-gray-200">
                        <input
                          type="number"
                          value={item.base}
                          onChange={(e) => {
                            const updated = [...compensations];
                            updated[idx].base = Number(e.target.value);
                            setCompensations(updated);
                          }}
                          className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          value={item.monthlyFixed}
                          onChange={(e) => {
                            const updated = [...compensations];
                            updated[idx].monthlyFixed = Number(e.target.value);
                            setCompensations(updated);
                          }}
                          className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">One time bonus (if any)</label>
              <input
                type="number"
                value={oneTimeBonus}
                onChange={(e) => setOneTimeBonus(e.target.value ? Number(e.target.value) : '')}
                className="w-[300px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Additional Information About Salary (if any):</label>
              <textarea
                value={additionalSalaryInfo}
                onChange={(e) => setAdditionalSalaryInfo(e.target.value)}
                rows={4}
                className="w-full max-w-[700px] p-3 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] resize-vertical"
              />
            </div>

            <button
              onClick={handleSaveTab}
              disabled={isSaving}
              className="bg-[#1B2A4A] text-white text-sm px-5 py-2 rounded font-medium hover:bg-[#2D3F5E] transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save and Next'}
            </button>
          </div>
        )}

        {/* Tab 4 - Selection Process */}
        {activeTab === 'selection' && (
          <div className="space-y-5">
            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">PPT</span>
              <Toggle checked={ppt} onChange={setPpt} />
              <span className="text-sm text-gray-700">{ppt ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">Shortlist from resume</span>
              <Toggle checked={shortlistResume} onChange={setShortlistResume} />
              <span className="text-sm text-gray-700">{shortlistResume ? 'Yes' : 'No'}</span>
            </div>

            <hr className="border-gray-200" />
            <h3 className="text-lg font-bold text-gray-900">Tests</h3>

            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">Written Test</span>
              <Toggle checked={writtenTest} onChange={setWrittenTest} />
              <span className="text-sm text-gray-700">{writtenTest ? 'Yes' : 'No'}</span>
            </div>

            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">Medical Test</span>
              <Toggle checked={medicalTest} onChange={setMedicalTest} />
              <span className="text-sm text-gray-700">{medicalTest ? 'Yes' : 'No'}</span>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Test Duration (mins)</label>
              <input
                type="text"
                value={testDuration}
                onChange={(e) => setTestDuration(e.target.value)}
                className="w-[500px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Test Requirements</label>
              <input
                type="text"
                value={testRequirements}
                onChange={(e) => setTestRequirements(e.target.value)}
                className="w-[500px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <hr className="border-gray-200" />
            <h3 className="text-lg font-bold text-gray-900">Interview</h3>

            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">In Person</span>
              <Toggle checked={inPerson} onChange={setInPerson} />
              <span className="text-sm text-gray-700">{inPerson ? 'Yes' : 'No'}</span>
            </div>

            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">Group Discussion</span>
              <Toggle checked={groupDiscussion} onChange={setGroupDiscussion} />
              <span className="text-sm text-gray-700">{groupDiscussion ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">Pre Interview Group Discussion</span>
              <Toggle checked={preInterviewGD} onChange={setPreInterviewGD} />
              <span className="text-sm text-gray-700">{preInterviewGD ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">Telephonic Interview</span>
              <Toggle checked={telephonic} onChange={setTelephonic} />
              <span className="text-sm text-gray-700">{telephonic ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-sm text-gray-800 w-[250px]">Video Conferencing</span>
              <Toggle checked={videoConferencing} onChange={setVideoConferencing} />
              <span className="text-sm text-gray-700">{videoConferencing ? 'Yes' : 'No'}</span>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Interview Duration</label>
              <input
                type="text"
                value={interviewDuration}
                onChange={(e) => setInterviewDuration(e.target.value)}
                className="w-[500px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <button
              onClick={handleSaveTab}
              disabled={isSaving}
              className="bg-[#1B2A4A] text-white text-sm px-5 py-2 rounded font-medium hover:bg-[#2D3F5E] transition-colors mt-2"
            >
              {isSaving ? 'Saving...' : 'Save and Next'}
            </button>
          </div>
        )}

        {/* Tab 5 - Bond Contract */}
        {activeTab === 'bond' && (
          <div className="space-y-6">
            <p className="text-sm font-bold text-gray-900">Details for job designation of: {designation || 'New Job'}</p>

            <div>
              <span className="block text-sm font-bold text-gray-900 mb-1.5">Bond Document <span className="text-gray-400 font-normal">(PDF only, File size limit : 1MB)</span></span>
              <div className="flex items-center gap-4">
                <label className="border border-gray-300 text-sm px-4 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer inline-flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {isUploadingBondFile ? 'Uploading...' : 'Upload'}
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'bond', setBondDocumentFile, setIsUploadingBondFile)} />
                </label>
                {bondDocumentFile && <a href={bondDocumentFile} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs">{bondDocumentFile.split('/').pop()}</a>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Bond Duration <span className="text-xs text-gray-500 font-normal ml-2">(Years / Months)</span></label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={bondDurationYears}
                  onChange={(e) => setBondDurationYears(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Years"
                  className="w-[120px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
                />
                <input
                  type="number"
                  value={bondDurationMonths}
                  onChange={(e) => setBondDurationMonths(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Months"
                  className="w-[120px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Bond Details</label>
              <div className="max-w-[600px] border border-gray-200 rounded overflow-hidden">
                <div className="flex gap-1 p-2 border-b border-gray-200 bg-white">
                  <button type="button" className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded">B</button>
                  <button type="button" className="px-2 py-1 text-sm italic hover:bg-gray-100 rounded">I</button>
                  <button type="button" className="px-2 py-1 text-sm underline hover:bg-gray-100 rounded">U</button>
                </div>
                <textarea
                  value={bondDetailsText}
                  onChange={(e) => setBondDetailsText(e.target.value)}
                  placeholder="Enter bond details here"
                  rows={4}
                  className="w-full p-3 text-sm focus:outline-none resize-vertical"
                />
              </div>
            </div>

            <button
              onClick={handleSaveTab}
              disabled={isSaving}
              className="bg-[#1B2A4A] text-white text-sm px-5 py-2 rounded font-medium hover:bg-[#2D3F5E] transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save and Next'}
            </button>
          </div>
        )}

        {/* Tab 6 - Additional Details */}
        {activeTab === 'additional' && (
          <div className="space-y-6">
            <p className="text-sm font-bold text-gray-900">Details for job designation of: {designation || 'New Job'}</p>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Title (type of additional details required from students)</label>
              <input
                type="text"
                value={additionalTitle}
                onChange={(e) => setAdditionalTitle(e.target.value)}
                className="w-[400px] p-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Description of the additional details required <span className="text-red-500">*</span></label>
              <div className="max-w-[500px] border border-gray-200 rounded overflow-hidden">
                <div className="flex gap-1 p-2 border-b border-gray-200 bg-white">
                  <button type="button" className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded">B</button>
                  <button type="button" className="px-2 py-1 text-sm italic hover:bg-gray-100 rounded">I</button>
                  <button type="button" className="px-2 py-1 text-sm underline hover:bg-gray-100 rounded">U</button>
                </div>
                <textarea
                  value={additionalDescription}
                  onChange={(e) => setAdditionalDescription(e.target.value)}
                  rows={5}
                  className="w-full p-3 text-sm focus:outline-none resize-vertical"
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border border-gray-200 rounded p-6 bg-gray-50 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Terms & Conditions</h3>
              <ol className="list-decimal pl-5 space-y-3">
                {termsAndConditions.map((term, idx) => (
                  <li key={idx} className="text-xs text-gray-700 leading-relaxed">{term}</li>
                ))}
              </ol>
            </div>

            <div className="flex items-start gap-2 mt-4">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-blue-600"
              />
              <label className="text-sm text-gray-800">
                We confirm our interest in recruitment from IIT Guwahati and agree to all of the terms and conditions mentioned above.
              </label>
            </div>

            <button
              onClick={handleSaveTab}
              disabled={!agreedTerms || isSaving}
              className={`text-sm px-6 py-2.5 rounded font-medium transition-colors ${
                agreedTerms && !isSaving
                  ? 'bg-[#1B2A4A] text-white hover:bg-[#2D3F5E]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Submitting...' : 'Complete & Submit'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function JAFNewPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="p-8 text-center text-gray-500">Loading form...</div>
        </DashboardLayout>
      }
    >
      <JAFFormContent />
    </Suspense>
  );
}
