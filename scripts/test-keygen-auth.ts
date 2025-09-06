#!/usr/bin/env tsx

/**
 * Test script to verify Keygen API authentication
 * Run with: pnpm tsx scripts/test-keygen-auth.ts
 */

import * as https from 'https';
import * as dotenv from 'dotenv';
import { URL } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

const KEYGEN_API_URL = process.env.NEXT_PUBLIC_KEYGEN_API_URL;
const KEYGEN_ADMIN_EMAIL = process.env.KEYGEN_ADMIN_EMAIL;
const KEYGEN_ADMIN_PASSWORD = process.env.KEYGEN_ADMIN_PASSWORD;

interface KeygenAccount {
  id: string;
  type: string;
  attributes: {
    name?: string;
    slug?: string;
  };
}

interface KeygenToken {
  id: string;
  type: string;
  attributes: {
    name?: string;
    token: string;
    expiry?: string;
  };
}

interface KeygenResponse<T> {
  data?: T;
  errors?: Array<{
    title: string;
    detail: string;
    code?: string;
  }>;
}

if (!KEYGEN_API_URL || !KEYGEN_ADMIN_EMAIL || !KEYGEN_ADMIN_PASSWORD) {
  console.error('❌ Missing required environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

console.log('🔐 Testing Keygen API Authentication...');
console.log(`📍 API URL: ${KEYGEN_API_URL}`);
console.log(`📧 Admin Email: ${KEYGEN_ADMIN_EMAIL}`);

function makeRequest<T>(
  url: string,
  options: https.RequestOptions & { body?: any }
): Promise<T> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/vnd.api+json',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      const postData = JSON.stringify(options.body);
      req.setHeader('Content-Type', 'application/vnd.api+json');
      req.setHeader('Content-Length', Buffer.byteLength(postData));
      req.write(postData);
    }

    req.end();
  });
}

async function getAccount(): Promise<string> {
  try {
    const response = await makeRequest<KeygenResponse<KeygenAccount[]>>(
      `${KEYGEN_API_URL}/accounts`,
      { method: 'GET' }
    );

    if (response.data && response.data.length > 0) {
      const account = response.data[0];
      console.log(`✅ Found account: ${account.id}`);
      console.log(`   Name: ${account.attributes.name || 'N/A'}`);
      return account.id;
    } else {
      console.log('📝 No account found, attempting to create one...');
      return await createInitialAccount();
    }
  } catch (error) {
    console.error('❌ Error getting account:', error);
    throw error;
  }
}

async function createInitialAccount(): Promise<string> {
  try {
    const response = await makeRequest<KeygenResponse<KeygenAccount>>(
      `${KEYGEN_API_URL}/accounts`,
      {
        method: 'POST',
        body: {
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
        }
      }
    );

    if (response.data) {
      console.log(`✅ Created account: ${response.data.id}`);
      return response.data.id;
    } else {
      console.error('❌ Failed to create account:', response.errors);
      throw new Error('Failed to create account');
    }
  } catch (error) {
    console.error('❌ Error creating account:', error);
    throw error;
  }
}

async function testAuthentication(accountId: string): Promise<KeygenToken> {
  const credentials = Buffer.from(
    `${KEYGEN_ADMIN_EMAIL}:${KEYGEN_ADMIN_PASSWORD}`
  ).toString('base64');

  try {
    const response = await makeRequest<KeygenResponse<KeygenToken>>(
      `${KEYGEN_API_URL}/accounts/${accountId}/tokens`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
        body: {
          data: {
            type: 'tokens',
            attributes: {
              name: 'Keygen UI Admin Token'
            }
          }
        }
      }
    );

    if (response.data) {
      console.log('✅ Authentication successful!');
      console.log(`🔑 Token created: ${response.data.id}`);
      console.log(`📝 Token value: ${response.data.attributes.token}`);
      console.log('\n⚠️  IMPORTANT: Save this token value - it cannot be retrieved again!');
      return response.data;
    } else {
      console.error('❌ Authentication failed');
      if (response.errors) {
        response.errors.forEach(error => {
          console.error(`   - ${error.title}: ${error.detail}`);
        });
      }
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.error('❌ Error during authentication:', error);
    throw error;
  }
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
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
})();