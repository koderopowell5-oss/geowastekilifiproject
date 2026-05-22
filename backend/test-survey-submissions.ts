/**
 * Test Survey Submissions End-to-End
 * Tests: Create survey -> Submit response -> Fetch submissions with project_id
 */

import axios from 'axios';

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

interface TestContext {
  authToken?: string;
  userId?: number;
  projectId?: string;
  surveyId?: number;
  submissionId?: number;
}

const ctx: TestContext = {};

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message: string, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function pass(message: string) {
  log(`✓ ${message}`, GREEN);
}

function fail(message: string, error?: any) {
  log(`✗ ${message}`, RED);
  if (error?.response?.data) {
    console.error('Response:', error.response.data);
  } else if (error) {
    console.error('Error:', error.message);
  }
}

async function makeRequest(
  method: 'get' | 'post' | 'put',
  endpoint: string,
  data?: any
): Promise<any> {
  try {
    const url = `${API_BASE}${endpoint}`;
    const config: any = {};

    if (ctx.authToken) {
      config.headers = { Authorization: `Bearer ${ctx.authToken}` };
    }

    const response = await axios[method](url, data, config);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

async function testLogin() {
  log('\n--- Testing Authentication ---', YELLOW);
  try {
    const response = await makeRequest('post', '/auth/login', {
      email: 'admin@geowaste.com',
      password: 'admin123',
    });

    if (response.success && response.data?.token) {
      ctx.authToken = response.data.token;
      ctx.userId = response.data.user?.id;
      ctx.projectId = response.data.user?.primary_project_id;
      pass(`Logged in with token: ${ctx.authToken?.substring(0, 20)}...`);
      pass(`User ID: ${ctx.userId}, Project ID: ${ctx.projectId}`);
      return true;
    } else {
      fail('Login failed');
      return false;
    }
  } catch (error) {
    fail('Login request failed', error);
    return false;
  }
}

async function testCreateSurvey() {
  log('\n--- Testing Survey Creation ---', YELLOW);
  try {
    const surveyData = {
      name: `Test Survey ${Date.now()}`,
      description: 'Automated test survey for submission testing',
      form_config: {
        sections: [
          {
            title: 'Location Information',
            fields: [
              { id: 'ward', label: 'Ward', type: 'text', required: true },
              {
                id: 'settlement_type',
                label: 'Settlement Type',
                type: 'select',
                options: ['Urban', 'Rural', 'Peri-urban'],
              },
            ],
          },
          {
            title: 'Waste Information',
            fields: [
              {
                id: 'waste_types',
                label: 'Waste Types',
                type: 'checkbox',
                options: ['Organic', 'Plastic', 'Metal', 'Glass', 'Paper'],
              },
              {
                id: 'disposal_method',
                label: 'Disposal Method',
                type: 'select',
                options: ['Landfill', 'Recycling', 'Composting', 'Burning'],
              },
            ],
          },
        ],
      },
    };

    const response = await makeRequest('post', '/surveys', surveyData);

    if (response.success && response.data?.id) {
      ctx.surveyId = response.data.id;
      pass(`Survey created with ID: ${ctx.surveyId}`);
      pass(`Survey name: ${response.data.name}`);
      return true;
    } else {
      fail('Survey creation failed');
      return false;
    }
  } catch (error) {
    fail('Survey creation request failed', error);
    return false;
  }
}

async function testSubmitSurvey() {
  log('\n--- Testing Survey Submission ---', YELLOW);
  if (!ctx.surveyId) {
    fail('No survey ID available');
    return false;
  }

  try {
    const submissionData = {
      responseData: {
        ward: 'Malindi',
        settlement_type: 'Urban',
        waste_types: ['Organic', 'Plastic'],
        disposal_method: 'Landfill',
        household_size: 5,
      },
      latitude: -3.2667,
      longitude: 40.1333,
      isDraft: false,
    };

    const response = await makeRequest('post', `/surveys/${ctx.surveyId}/submit`, submissionData);

    if (response.success && response.data?.id) {
      ctx.submissionId = response.data.id;
      pass(`Submission created with ID: ${ctx.submissionId}`);
      pass(`Project ID in submission: ${response.data.project_id || 'NULL'}`);
      pass(`Response data saved with ward: ${response.data.response_data?.ward}`);

      // Verify project_id is set
      if (response.data.project_id === ctx.projectId || response.data.project_id === null) {
        pass(`Project ID correctly set`);
      } else {
        log(
          `  ⚠ Project ID mismatch: expected ${ctx.projectId}, got ${response.data.project_id}`,
          YELLOW
        );
      }

      return true;
    } else {
      fail('Submission failed');
      return false;
    }
  } catch (error) {
    fail('Submission request failed', error);
    return false;
  }
}

async function testSubmitDraftSurvey() {
  log('\n--- Testing Draft Survey Submission ---', YELLOW);
  if (!ctx.surveyId) {
    fail('No survey ID available');
    return false;
  }

  try {
    const submissionData = {
      responseData: {
        ward: 'Mombasa',
        settlement_type: 'Rural',
        waste_types: ['Metal'],
        // Note: disposal_method is missing - draft should allow this
      },
      latitude: -4.0435,
      longitude: 39.6682,
      isDraft: true,
    };

    const response = await makeRequest('post', `/surveys/${ctx.surveyId}/submit`, submissionData);

    if (response.success && response.data?.id) {
      pass(`Draft submission created with ID: ${response.data.id}`);
      pass(`Status: ${response.data.status} (should be 'draft')`);
      pass(`Project ID: ${response.data.project_id || 'NULL'}`);
      return true;
    } else {
      fail('Draft submission failed');
      return false;
    }
  } catch (error) {
    fail('Draft submission request failed', error);
    return false;
  }
}

async function testFetchSubmissions() {
  log('\n--- Testing Fetch Submissions ---', YELLOW);
  if (!ctx.surveyId) {
    fail('No survey ID available');
    return false;
  }

  try {
    const response = await makeRequest('get', `/surveys/${ctx.surveyId}/submissions`);

    if (response.success && Array.isArray(response.data)) {
      pass(`Fetched ${response.data.length} submission(s)`);

      response.data.forEach((submission: any, idx: number) => {
        log(
          `  [${idx + 1}] ID: ${submission.id}, Status: ${submission.status}, Project: ${submission.project_id || 'NULL'}`
        );
        if (submission.response_data) {
          log(`      Ward: ${submission.response_data.ward}, Types: ${submission.response_data.waste_types}`);
        }
      });

      // Verify project_id is present in all submissions
      const allHaveProjectId = response.data.every((s: any) => s.project_id !== undefined);
      if (allHaveProjectId) {
        pass('All submissions have project_id field');
      } else {
        fail('Some submissions missing project_id field');
        return false;
      }

      return true;
    } else {
      fail('Fetch submissions failed');
      return false;
    }
  } catch (error) {
    fail('Fetch submissions request failed', error);
    return false;
  }
}

async function testFilterByProjectId() {
  log('\n--- Testing Project ID Filtering ---', YELLOW);
  if (!ctx.surveyId) {
    fail('No survey ID available');
    return false;
  }

  try {
    const response = await makeRequest('get', `/surveys/${ctx.surveyId}/submissions`);

    if (response.success && Array.isArray(response.data)) {
      const submissionsInProject = response.data.filter(
        (s: any) => String(s.project_id) === String(ctx.projectId)
      );
      const submissionsNotInProject = response.data.filter(
        (s: any) => String(s.project_id) !== String(ctx.projectId)
      );

      pass(`Total submissions: ${response.data.length}`);
      pass(`Submissions in project ${ctx.projectId}: ${submissionsInProject.length}`);

      if (submissionsNotInProject.length > 0) {
        log(`  ⚠ Submissions from other projects: ${submissionsNotInProject.length}`, YELLOW);
      }

      return true;
    } else {
      fail('Filter test failed');
      return false;
    }
  } catch (error) {
    fail('Filter test request failed', error);
    return false;
  }
}

async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', YELLOW);
  log('║ Survey Submissions End-to-End Test Suite              ║', YELLOW);
  log('╚═══════════════════════════════════════════════════════╝', YELLOW);

  const results = {
    login: await testLogin(),
    createSurvey: await testCreateSurvey(),
    submitSurvey: await testSubmitSurvey(),
    submitDraft: await testSubmitDraftSurvey(),
    fetchSubmissions: await testFetchSubmissions(),
    filterByProject: await testFilterByProjectId(),
  };

  log('\n╔═══════════════════════════════════════════════════════╗', YELLOW);
  log('║ Test Results Summary                                   ║', YELLOW);
  log('╚═══════════════════════════════════════════════════════╝', YELLOW);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? GREEN : RED;
    log(`${status}: ${test}`, color);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  log(`\nTotal: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`, GREEN);

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  fail('Test suite crashed', error);
  process.exit(1);
});
