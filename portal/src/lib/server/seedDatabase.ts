import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';

export async function seedAllDatabaseData() {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not established');

  // 1. Disciplines
  const disciplines = [
    { code: 'BSBE', name: 'Biosciences and Bioengineering', department: 'Biosciences and Bioengineering', programmes: ['Ph.D.', 'M.Tech', 'B.Tech'] },
    { code: 'CL', name: 'Chemical Engineering', department: 'Chemical Engineering', programmes: ['Ph.D.', 'M.Tech', 'B.Tech'] },
    { code: 'CH', name: 'Chemistry', department: 'Chemistry', programmes: ['Ph.D.', 'M.Sc.'] },
    { code: 'CE', name: 'Civil Engineering', department: 'Civil Engineering', programmes: ['Ph.D.', 'M.Tech', 'B.Tech'] },
    { code: 'CSE', name: 'Computer Science and Engineering', department: 'Computer Science and Engineering', programmes: ['Ph.D.', 'M.Tech', 'B.Tech'] },
    { code: 'DD', name: 'Department of Design', department: 'Design', programmes: ['Ph.D.', 'M.Des', 'B.Des'] },
    { code: 'EEE', name: 'Electronics and Electrical Engineering', department: 'Electronics and Electrical Engineering', programmes: ['Ph.D.', 'M.Tech', 'B.Tech'] },
    { code: 'HSS', name: 'Humanities and Social Sciences', department: 'Humanities and Social Sciences', programmes: ['Ph.D.', 'MA'] },
    { code: 'MA', name: 'Mathematics', department: 'Mathematics', programmes: ['Ph.D.', 'M.Sc.', 'B.Tech'] },
    { code: 'ME', name: 'Mechanical Engineering', department: 'Mechanical Engineering', programmes: ['Ph.D.', 'M.Tech', 'B.Tech'] },
    { code: 'PH', name: 'Physics', department: 'Physics', programmes: ['Ph.D.', 'M.Sc.', 'B.Tech'] },
  ];
  await db.collection('disciplines').deleteMany({});
  await db.collection('disciplines').insertMany(disciplines.map(d => ({ ...d, createdAt: new Date(), updatedAt: new Date() })));

  // 2. Companies
  const hashedPassword = await bcrypt.hash('company123', 10);
  const companies = [
    {
      _id: new mongoose.Types.ObjectId('650000000000000000000001'),
      company_name: 'Video Testing Corp',
      email: 'recruiter@videotesting.com',
      password: hashedPassword,
      company_desc: 'Pioneering next-generation real-time video intelligence and neural codec research.',
      website_url: 'https://videotesting.com',
      postal_address: 'Outer Ring Road, Bengaluru, Karnataka 560103',
      organization_type: 'Private',
      industry_sec: 'AI / Video Technology',
      first_point: {
        full_name: 'Joe Smith',
        email: 'recruiter@videotesting.com',
        contact: '+91 9876543210',
      },
      second_point: {
        full_name: 'Sarah Connor',
        email: 'talent@videotesting.com',
        contact: '+91 9876543211',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId('650000000000000000000002'),
      company_name: 'Google DeepMind India',
      email: 'recruiter@google.com',
      password: hashedPassword,
      company_desc: 'Foundational artificial intelligence research laboratory creating world-class intelligence architectures.',
      website_url: 'https://deepmind.google',
      postal_address: 'RMZ Infinity, Old Madras Road, Bengaluru, Karnataka 560016',
      organization_type: 'MNC',
      industry_sec: 'Artificial Intelligence',
      first_point: {
        full_name: 'Dr. Neha Verma',
        email: 'nverma@google.com',
        contact: '+91 9820199201',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId('650000000000000000000003'),
      company_name: 'Intel Labs India',
      email: 'recruiter@intel.com',
      password: hashedPassword,
      company_desc: 'Advanced silicon architecture, neuromorphic processors, and edge computing acceleration.',
      website_url: 'https://intel.com/labs',
      postal_address: 'Sarjapur Ring Road, Bengaluru, Karnataka 560103',
      organization_type: 'MNC',
      industry_sec: 'Semiconductors & Systems',
      first_point: {
        full_name: 'Vikram Joshi',
        email: 'recruiter@intel.com',
        contact: '+91 9900112233',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId('650000000000000000000004'),
      company_name: 'Qualcomm India',
      email: 'recruiter@qualcomm.com',
      password: hashedPassword,
      company_desc: 'Wireless communication, on-device generative AI, and high-performance SoC design.',
      website_url: 'https://qualcomm.com',
      postal_address: 'Mindspace IT Park, Hitec City, Hyderabad, Telangana 500081',
      organization_type: 'MNC',
      industry_sec: 'Telecommunications & Silicon',
      first_point: {
        full_name: 'Ananya Deshmukh',
        email: 'recruiter@qualcomm.com',
        contact: '+91 9123456789',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  await db.collection('companies').deleteMany({});
  await db.collection('companies').insertMany(companies);

  // 3. Students
  const students = [
    {
      _id: new mongoose.Types.ObjectId('651000000000000000000001'),
      roll_number: 216101001,
      name: 'Bibek Nath',
      email: 'n.bibek@iitg.ac.in',
      gender: 'Male',
      nationality: 'Indian',
      fee_paid: true,
      fee_remaining: 0,
      backlogs: 0,
      year_of_admission: 2022,
      major_cpi: 8.92,
      academic_details: {
        major_department: 'Computer Science and Engineering',
        major_programme: 'Ph.D.',
        major_discipline: 'Computer Science and Engineering',
      },
      cv_verified: false,
      cv_flagged: false,
      status: 'Sitting_Intern',
      registration_complete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId('651000000000000000000002'),
      roll_number: 216102002,
      name: 'Priya Sharma',
      email: 'p.sharma@iitg.ac.in',
      gender: 'Female',
      nationality: 'Indian',
      fee_paid: true,
      fee_remaining: 0,
      backlogs: 0,
      year_of_admission: 2022,
      major_cpi: 9.15,
      academic_details: {
        major_department: 'Electronics and Electrical Engineering',
        major_programme: 'Ph.D.',
        major_discipline: 'Electronics and Electrical Engineering',
      },
      cv_verified: false,
      cv_flagged: false,
      status: 'Sitting_Intern',
      registration_complete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId('651000000000000000000003'),
      roll_number: 216103003,
      name: 'Rahul Verma',
      email: 'r.verma@iitg.ac.in',
      gender: 'Male',
      nationality: 'Indian',
      fee_paid: true,
      fee_remaining: 0,
      backlogs: 0,
      year_of_admission: 2022,
      major_cpi: 8.45,
      academic_details: {
        major_department: 'Mechanical Engineering',
        major_programme: 'Ph.D.',
        major_discipline: 'Mechanical Engineering',
      },
      cv_verified: false,
      cv_flagged: false,
      status: 'Sitting_Intern',
      registration_complete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  await db.collection('students').deleteMany({});
  await db.collection('students').insertMany(students);

  // 4. Jobs
  const job1Id = new mongoose.Types.ObjectId('652000000000000000000001');
  const job2Id = new mongoose.Types.ObjectId('652000000000000000000002');
  const job3Id = new mongoose.Types.ObjectId('652000000000000000000003');
  const job4Id = new mongoose.Types.ObjectId('652000000000000000000004');
  const job5Id = new mongoose.Types.ObjectId('652000000000000000000005');

  const jobs = [
    {
      _id: job1Id,
      companyId: companies[0]._id,
      company: companies[0]._id,
      jobDesignation: 'Research Scientist (Computer Vision & Video)',
      job_designation: 'Research Scientist (Computer Vision & Video)',
      status: 'Unapproved',
      jobDescription: {
        mode: 'html',
        content: 'Lead next-generation video compression, generative video models, and real-time streaming architectures. Requires strong publication record in CVPR, ICCV, or ECCV.',
      },
      job_description: 'Lead next-generation video compression, generative video models, and real-time streaming architectures.',
      placeOfPosting: 'Bengaluru / Hyderabad (Hybrid)',
      place_of_posting: 'Bengaluru / Hyderabad (Hybrid)',
      numOpenings: 3,
      num_openings: 3,
      applicationDeadline: new Date('2026-10-15'),
      application_deadline: new Date('2026-10-15'),
      eligibility: [
        { department: 'Computer Science and Engineering', cpiCutoff: 7.5 },
        { department: 'Electronics and Electrical Engineering', cpiCutoff: 7.5 },
        { department: 'Mathematics', cpiCutoff: 7.5 },
      ],
      salary: {
        currency: 'INR',
        programmes: [
          { programme: 'Computer Science and Engineering', amount: 4200000 },
          { programme: 'Electronics and Electrical Engineering', amount: 4200000 },
        ],
        accommodationAvailable: true,
        ppoExtension: true,
        additionalInfo: 'Base: ₹ 32.0 LPA, Performance Bonus: ₹ 6.0 LPA, Relocation + Medical',
      },
      selectionProcess: {
        ppt: true,
        resumeShortlist: true,
        writtenTest: true,
        technicalInterview: true,
        hrInterview: true,
        notes: 'OA on Oct 18, Panel Interviews in hybrid mode.',
      },
      agreedToTerms: true,
      selectedStudents: [students[0]._id],
      cvs: [{ type: 'core', student: students[0]._id, status: 'shortlist' }],
      createdAt: new Date('2026-09-20'),
      updatedAt: new Date('2026-09-20'),
    },
    {
      _id: job2Id,
      companyId: companies[1]._id,
      company: companies[1]._id,
      jobDesignation: 'Research Scientist — PhD Placement',
      job_designation: 'Research Scientist — PhD Placement',
      status: 'Approved',
      jobDescription: {
        mode: 'html',
        content: 'Conduct foundational AI research on multimodal foundation models, reasoning, and reinforcement learning.',
      },
      job_description: 'Conduct foundational AI research on multimodal foundation models, reasoning, and reinforcement learning.',
      placeOfPosting: 'Bengaluru, India',
      place_of_posting: 'Bengaluru, India',
      numOpenings: 5,
      num_openings: 5,
      applicationDeadline: new Date('2026-10-20'),
      application_deadline: new Date('2026-10-20'),
      eligibility: [
        { department: 'Computer Science and Engineering', cpiCutoff: 8.0 },
        { department: 'Mathematics', cpiCutoff: 8.0 },
      ],
      salary: {
        currency: 'INR',
        programmes: [
          { programme: 'Computer Science and Engineering', amount: 6500000 },
          { programme: 'Mathematics', amount: 6500000 },
        ],
        accommodationAvailable: true,
        ppoExtension: true,
        additionalInfo: 'Base: ₹ 45.0 LPA + RSUs + Joining Bonus',
      },
      selectionProcess: {
        ppt: true,
        resumeShortlist: true,
        writtenTest: false,
        technicalInterview: true,
        hrInterview: true,
      },
      agreedToTerms: true,
      selectedStudents: [students[0]._id, students[1]._id],
      cvs: [
        { type: 'tech', student: students[0]._id, status: 'selected' },
        { type: 'tech', student: students[1]._id, status: 'shortlist' },
      ],
      createdAt: new Date('2026-09-22'),
      updatedAt: new Date('2026-09-22'),
    },
    {
      _id: job3Id,
      companyId: companies[2]._id,
      company: companies[2]._id,
      jobDesignation: 'Principal Hardware & Systems Architect',
      job_designation: 'Principal Hardware & Systems Architect',
      status: 'Approved',
      jobDescription: {
        mode: 'html',
        content: 'Architect energy-efficient compute accelerators and heterogeneous silicon architectures.',
      },
      job_description: 'Architect energy-efficient compute accelerators and heterogeneous silicon architectures.',
      placeOfPosting: 'Bengaluru',
      place_of_posting: 'Bengaluru',
      numOpenings: 4,
      num_openings: 4,
      applicationDeadline: new Date('2026-10-22'),
      application_deadline: new Date('2026-10-22'),
      eligibility: [
        { department: 'Electronics and Electrical Engineering', cpiCutoff: 7.0 },
        { department: 'Computer Science and Engineering', cpiCutoff: 7.0 },
      ],
      salary: {
        currency: 'INR',
        programmes: [{ programme: 'Electronics and Electrical Engineering', amount: 3850000 }],
        accommodationAvailable: false,
        ppoExtension: false,
      },
      selectionProcess: {
        ppt: true,
        resumeShortlist: true,
        writtenTest: true,
        technicalInterview: true,
        hrInterview: true,
      },
      agreedToTerms: true,
      selectedStudents: [students[1]._id],
      cvs: [{ type: 'core', student: students[1]._id, status: 'selected' }],
      createdAt: new Date('2026-09-24'),
      updatedAt: new Date('2026-09-24'),
    },
    {
      _id: job4Id,
      companyId: companies[3]._id,
      company: companies[3]._id,
      jobDesignation: 'Senior AI/ML Researcher',
      job_designation: 'Senior AI/ML Researcher',
      status: 'Changes Requested',
      feedback: 'Please clarify required GPU cluster experience and accommodation details.',
      jobDescription: {
        mode: 'html',
        content: 'Research and deploy on-device generative AI models and neural processing unit optimizations.',
      },
      job_description: 'Research and deploy on-device generative AI models and neural processing unit optimizations.',
      placeOfPosting: 'Hyderabad',
      place_of_posting: 'Hyderabad',
      numOpenings: 2,
      num_openings: 2,
      applicationDeadline: new Date('2026-10-25'),
      application_deadline: new Date('2026-10-25'),
      eligibility: [{ department: 'Computer Science and Engineering', cpiCutoff: 7.5 }],
      salary: {
        currency: 'INR',
        programmes: [{ programme: 'Computer Science and Engineering', amount: 3600000 }],
      },
      agreedToTerms: true,
      createdAt: new Date('2026-09-25'),
      updatedAt: new Date('2026-09-25'),
    },
    {
      _id: job5Id,
      companyId: companies[0]._id,
      company: companies[0]._id,
      jobDesignation: 'Quantitative Systems Analyst',
      job_designation: 'Quantitative Systems Analyst',
      status: 'Incomplete',
      jobDescription: {
        mode: 'html',
        content: 'Draft job application form pending final compensation schedule.',
      },
      job_description: 'Draft job application form pending final compensation schedule.',
      placeOfPosting: 'Bengaluru',
      place_of_posting: 'Bengaluru',
      numOpenings: 1,
      num_openings: 1,
      agreedToTerms: false,
      createdAt: new Date('2026-09-26'),
      updatedAt: new Date('2026-09-26'),
    },
  ];
  await db.collection('jobs').deleteMany({});
  await db.collection('jobs').insertMany(jobs);

  // 5. Offers
  const offers = [
    {
      _id: new mongoose.Types.ObjectId('653000000000000000000001'),
      job: job2Id,
      company: companies[1]._id,
      student: students[0]._id,
      designation: 'Research Scientist — PhD Placement',
      ctc: '₹ 65.0 LPA',
      base_salary: '₹ 45.0 LPA',
      offered_at: new Date('2026-09-28'),
      response_deadline: new Date('2026-10-30'),
      status: 'received',
      coordinator_notes: '',
      createdAt: new Date('2026-09-28'),
      updatedAt: new Date('2026-09-28'),
    },
    {
      _id: new mongoose.Types.ObjectId('653000000000000000000002'),
      job: job3Id,
      company: companies[2]._id,
      student: students[1]._id,
      designation: 'Principal Hardware & Systems Architect',
      ctc: '₹ 38.5 LPA',
      base_salary: '₹ 28.0 LPA',
      offered_at: new Date('2026-09-29'),
      response_deadline: new Date('2026-10-31'),
      status: 'received',
      coordinator_notes: '',
      createdAt: new Date('2026-09-29'),
      updatedAt: new Date('2026-09-29'),
    },
  ];
  await db.collection('offers').deleteMany({});
  await db.collection('offers').insertMany(offers);

  // 6. Portal Users
  const portalUsers = [
    {
      email: 'placement.head@iitg.ac.in',
      name: 'Prof. Amit Kumar / Ravi Teja',
      role: 'coordinator',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'amitk@iitg.ac.in',
      name: 'Prof. Amit Kumar',
      role: 'coordinator',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'n.bibek@iitg.ac.in',
      name: 'Bibek Nath',
      role: 'student',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'p.sharma@iitg.ac.in',
      name: 'Priya Sharma',
      role: 'student',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      email: 'recruiter@videotesting.com',
      name: 'Video Testing Corp',
      role: 'company',
      company: companies[0]._id,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  await db.collection('portalusers').deleteMany({});
  await db.collection('portalusers').insertMany(portalUsers);

  // 7. Announcements
  const announcements = [
    {
      title: 'PhD Placement Drive 2026-27 Commencing',
      message: 'The annual PhD campus placement session has officially commenced. All registered PhD scholars are advised to complete their profile verification and ensure their master CV is approved by the placement cell.',
      category: 'Important',
      audience: 'all_students',
      status: 'published',
      publish_at: new Date('2026-09-15'),
      created_by_email: 'placement.head@iitg.ac.in',
      created_by_name: 'Placement Head, CCD',
      createdAt: new Date('2026-09-15'),
      updatedAt: new Date('2026-09-15'),
    },
    {
      title: 'Google DeepMind India Pre-Placement Session',
      message: 'Google DeepMind India will conduct a research presentation and interactive Q&A for final-year PhD scholars in Computer Science, Mathematics, and Electrical Engineering on Oct 16 at 5:00 PM via Google Meet.',
      category: 'Event',
      audience: 'all_students',
      status: 'published',
      publish_at: new Date('2026-09-22'),
      link: 'https://meet.google.com',
      created_by_email: 'placement.head@iitg.ac.in',
      created_by_name: 'Placement Head, CCD',
      createdAt: new Date('2026-09-22'),
      updatedAt: new Date('2026-09-22'),
    },
    {
      title: 'CV Verification & Submission Guidelines',
      message: 'Please review the standard LaTeX/Word templates on the portal before uploading your 1-page and 2-page resumes. Submissions with unverified publications or missing DOI links will be flagged.',
      category: 'General',
      audience: 'all_students',
      status: 'published',
      publish_at: new Date('2026-09-20'),
      created_by_email: 'placement.head@iitg.ac.in',
      created_by_name: 'Placement Head, CCD',
      createdAt: new Date('2026-09-20'),
      updatedAt: new Date('2026-09-20'),
    },
  ];
  await db.collection('announcements').deleteMany({});
  await db.collection('announcements').insertMany(announcements);

  return {
    disciplines: disciplines.length,
    companies: companies.length,
    students: students.length,
    jobs: jobs.length,
    offers: offers.length,
    portalUsers: portalUsers.length,
    announcements: announcements.length,
  };
}
