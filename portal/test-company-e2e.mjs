
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = 'http://localhost:3000/phdplacement';
let sessionCookie = '';

function log(msg) {
  console.log(`[INFO] ${msg}`);
}

function success(msg) {
  console.log(`[SUCCESS] ${msg}`);
}

function error(msg) {
  console.error(`[ERROR] ${msg}`);
}

async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (sessionCookie) {
    headers.Cookie = sessionCookie;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const setCookieHeader = response.headers.getSetCookie ? response.headers.getSetCookie() : [response.headers.get('set-cookie')];
  if (setCookieHeader && setCookieHeader.length > 0 && setCookieHeader[0]) {
    sessionCookie = setCookieHeader[0].split(';')[0];
  }

  const status = response.status;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`API failed: ${endpoint} | Status: ${status} | Error: ${JSON.stringify(data)}`);
  }

  return data;
}

async function runE2ETests() {
  const email = `test.recruiter.${Date.now()}@testcompany.com`;
  const password = 'TestPassword123!';
  let jafId = '';

  try {
    log('--- STARTING COMPANY E2E TEST ---');

    // 1. Registration
    log(`Registering new company with email: ${email}`);
    await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        company: {
          name: 'Test E2E Company',
          description: 'A test company for E2E',
          industrySector: 'IT',
          organizationType: 'Private',
          postalAddress: '123 Test St',
          website: 'https://testcompany.com'
        },
        primaryContact: {
          name: 'John Doe',
          designation: 'Recruiter',
          phone: '1234567890',
          email: email
        },
        agreedToPolicy: true
      })
    });
    success('Company registered successfully.');

    // 2. Authentication
    log('Logging in as company');
    await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    success('Company logged in successfully. Received auth token.');

    // 3. Profile Fetch
    log('Fetching company profile');
    const profileData = await apiFetch('/api/company/profile');
    if (profileData.profile.email !== email) throw new Error('Profile email mismatch');
    success('Company profile fetched successfully.');

    // 4. Create Draft JAF
    log('Creating new JAF draft');
    const createJafData = await apiFetch('/api/jaf', { method: 'POST' });
    jafId = createJafData.job._id;
    success(`Draft JAF created with ID: ${jafId}`);

    // 5. Update Job Details Tab
    log('Updating Job Details tab');
    await apiFetch(`/api/jaf/${jafId}/job-details`, {
      method: 'PUT',
      body: JSON.stringify({
        jobDesignation: 'E2E Testing Engineer',
        jobDescription: { mode: 'html', content: 'Testing E2E flows' },
        placeOfPosting: 'Bangalore',
        numOpenings: 5
      })
    });
    success('Job details updated.');

    // 6. Update Salary Tab
    log('Updating Salary tab');
    await apiFetch(`/api/jaf/${jafId}/salary`, {
      method: 'PUT',
      body: JSON.stringify({
        salary: {
          currency: 'INR',
          programmes: [{ programme: 'Computer Science and Engineering', amount: 80000 }],
          accommodationAvailable: true,
          ppoExtension: false,
          additionalInfo: 'Bonus included'
        }
      })
    });
    success('Salary updated.');

    // 7. Update Eligibility Tab
    log('Updating Eligibility tab');
    await apiFetch(`/api/jaf/${jafId}/eligibility`, {
      method: 'PUT',
      body: JSON.stringify({
        eligibility: [
          { department: 'Computer Science and Engineering', cpiCutoff: 7.0 }
        ]
      })
    });
    success('Eligibility updated.');

    // 8. Update Selection Process Tab
    log('Updating Selection Process tab');
    await apiFetch(`/api/jaf/${jafId}/selection`, {
      method: 'PUT',
      body: JSON.stringify({
        selectionProcess: {
          ppt: true,
          shortlistResume: true,
          writtenTest: false,
          inPerson: false,
          telephonic: true,
          videoConferencing: true
        }
      })
    });
    success('Selection process updated.');

    // 9. Final Submit (Additional Tab)
    log('Submitting Additional tab (Final Submission)');
    await apiFetch(`/api/jaf/${jafId}/additional`, {
      method: 'PUT',
      body: JSON.stringify({
        additionalRequirements: [{ title: 'NDA', description: 'Sign NDA before joining' }],
        agreedToTerms: true
      })
    });
    success('JAF final submission completed.');

    // 10. Fetch JAF List for Dashboard
    log('Fetching JAF list from Dashboard');
    const jobsData = await apiFetch('/api/jaf');
    if (!jobsData.jobs || jobsData.jobs.length === 0) {
      throw new Error('JAF list is empty after creating one.');
    }
    const myJob = jobsData.jobs.find(j => j._id === jafId);
    if (!myJob) throw new Error('Newly created JAF not found in list.');
    success('JAF list fetched successfully and verified newly created JAF.');

    // 11. Fetch Disciplines (Sanity check)
    log('Fetching disciplines');
    const disciplinesData = await apiFetch('/api/jaf/disciplines');
    if (!disciplinesData.data || disciplinesData.data.length === 0) {
      error('Disciplines endpoint returned empty data, but this might be expected if unseeded.');
    } else {
      success(`Fetched ${disciplinesData.data.length} disciplines.`);
    }

    // 12. Logout
    log('Logging out');
    await apiFetch('/api/auth/logout', { method: 'POST' });
    success('Logged out successfully.');

    log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    error(`TEST FAILED: ${err.message}`);
    process.exit(1);
  }
}

runE2ETests();
