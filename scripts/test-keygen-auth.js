#!/usr/bin/env node

/**
 * Test script to verify Keygen API authentication
 * Run with: node scripts/test-keygen-auth.js
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const KEYGEN_API_URL = process.env.NEXT_PUBLIC_KEYGEN_API_URL;
const KEYGEN_ADMIN_EMAIL = process.env.KEYGEN_ADMIN_EMAIL;
const KEYGEN_ADMIN_PASSWORD = process.env.KEYGEN_ADMIN_PASSWORD;

if (!KEYGEN_API_URL || !KEYGEN_ADMIN_EMAIL || !KEYGEN_ADMIN_PASSWORD) {
  console.error('❌ Missing required environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

console.log('🔐 Testing Keygen API Authentication...');
console.log(`📍 API URL: ${KEYGEN_API_URL}`);
console.log(`📧 Admin Email: ${KEYGEN_ADMIN_EMAIL}`);

// Since this is self-hosted CE, we first need to get the account
// In CE mode, there's typically one account
async function getAccount() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${KEYGEN_API_URL}/accounts`);
    
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.api+json',
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && response.data.length > 0) {
            const account = response.data[0];
            console.log(`✅ Found account: ${account.id}`);
            console.log(`   Name: ${account.attributes.name || 'N/A'}`);
            resolve(account.id);
          } else {
            // Try to create initial account
            console.log('📝 No account found, attempting to create one...');
            createInitialAccount().then(resolve).catch(reject);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function createInitialAccount() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${KEYGEN_API_URL}/accounts`);
    
    const postData = JSON.stringify({
      data: {
        type: 'accounts',
        attributes: {
          name: 'PVX AI',
          slug: 'pvx-ai'
        }
      },
      meta: {
        email: KEYGEN_ADMIN_EMAIL,
        password: KEYGEN_ADMIN_PASSWORD
      }
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data) {
            console.log(`✅ Created account: ${response.data.id}`);
            resolve(response.data.id);
          } else {
            console.error('❌ Failed to create account:', response.errors);
            reject(new Error('Failed to create account'));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testAuthentication(accountId) {
  return new Promise((resolve, reject) => {
    const credentials = Buffer.from(`${KEYGEN_ADMIN_EMAIL}:${KEYGEN_ADMIN_PASSWORD}`).toString('base64');
    const url = new URL(`${KEYGEN_API_URL}/accounts/${accountId}/tokens`);
    
    const postData = JSON.stringify({
      data: {
        type: 'tokens',
        attributes: {
          name: 'Keygen UI Admin Token'
        }
      }
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Basic ${credentials}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201 && response.data) {
            console.log('✅ Authentication successful!');
            console.log(`🔑 Token created: ${response.data.id}`);
            console.log(`📝 Token value: ${response.data.attributes.token}`);
            console.log('\n⚠️  IMPORTANT: Save this token value - it cannot be retrieved again!');
            resolve(response.data);
          } else {
            console.error(`❌ Authentication failed (Status: ${res.statusCode})`);
            if (response.errors) {
              response.errors.forEach(error => {
                console.error(`   - ${error.title}: ${error.detail}`);
              });
            }
            reject(new Error('Authentication failed'));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.error('Response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
(async () => {
  try {
    console.log('\n1️⃣  Getting account information...');
    const accountId = await getAccount();
    
    console.log('\n2️⃣  Testing authentication...');
    await testAuthentication(accountId);
    
    console.log('\n✨ All tests passed! Your Keygen instance is properly configured.');
    console.log(`\n📝 Add this to your .env.local file:`);
    console.log(`NEXT_PUBLIC_KEYGEN_ACCOUNT_ID=${accountId}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
})();