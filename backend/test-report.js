const axios = require('axios');

async function testReportSubmission() {
  const citizenCredentials = { email: 'citizen@cms.com', password: 'citizen123' };
  let accessToken = '';

  try {
    // 1. Login as citizen to get access token
    console.log(`\n--- Logging in as ${citizenCredentials.email} ---`);
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', citizenCredentials);
    accessToken = loginResponse.data.data.accessToken;
    console.log('✅ Citizen login successful.');

    // 2. Submit a new report
    console.log('\n--- Submitting a new report as citizen ---');
    const reportData = {
      title: 'Test Report from Citizen',
      description: 'This is a test report submitted programmatically.',
      crime_type: 'theft',
      location: 'Test Location, Addis Ababa',
      urgency_level: 'medium',
      occurrence_date: new Date().toISOString()
    };

    const reportResponse = await axios.post('http://localhost:5000/api/v1/reports', reportData, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    console.log('✅ Report submission successful!');
    console.log('Report ID:', reportResponse.data.data.report.id);

  } catch (error) {
    console.error('❌ Report submission failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testReportSubmission();
