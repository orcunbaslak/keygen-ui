#!/usr/bin/env tsx

/**
 * Test script for the TypeScript API client
 * Run with: pnpm tsx scripts/test-api-client.ts
 */

import * as dotenv from 'dotenv';
import { KeygenClient } from '../src/lib/api/client';

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_KEYGEN_API_URL;
const ACCOUNT_ID = process.env.NEXT_PUBLIC_KEYGEN_ACCOUNT_ID;
const ADMIN_EMAIL = process.env.KEYGEN_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.KEYGEN_ADMIN_PASSWORD;

async function testApiClient() {
  if (!API_URL || !ACCOUNT_ID || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  console.log('🚀 Testing TypeScript API Client...');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📋 Account ID: ${ACCOUNT_ID}`);

  try {
    // Create client
    const client = new KeygenClient({
      apiUrl: API_URL,
      accountId: ACCOUNT_ID,
    });

    console.log('\n1️⃣  Testing authentication...');
    const token = await client.authenticate(ADMIN_EMAIL, ADMIN_PASSWORD, 'API Client Test Token');
    console.log(`✅ Authentication successful!`);
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);

    console.log('\n2️⃣  Testing "Who Am I" endpoint...');
    const meResponse = await client.me();
    console.log(`✅ Current user:`, {
      id: meResponse.data?.id,
      type: meResponse.data?.type,
      email: meResponse.data?.attributes?.email,
      role: meResponse.data?.attributes?.role,
    });

    console.log('\n3️⃣  Testing licenses endpoint...');
    const licensesResponse = await client.request('licenses', {
      params: { limit: 5 }
    });
    console.log(`✅ Found ${licensesResponse.data?.length || 0} licenses`);
    if (licensesResponse.data && licensesResponse.data.length > 0) {
      const firstLicense = licensesResponse.data[0];
      console.log(`   First license: ${firstLicense.id} (${firstLicense.attributes.status})`);
    }

    console.log('\n4️⃣  Testing machines endpoint...');
    const machinesResponse = await client.request('machines', {
      params: { limit: 5 }
    });
    console.log(`✅ Found ${machinesResponse.data?.length || 0} machines`);
    if (machinesResponse.data && machinesResponse.data.length > 0) {
      const firstMachine = machinesResponse.data[0];
      console.log(`   First machine: ${firstMachine.id} (${firstMachine.attributes.platform || 'unknown platform'})`);
    }

    console.log('\n5️⃣  Testing users endpoint...');
    const usersResponse = await client.request('users', {
      params: { limit: 5 }
    });
    console.log(`✅ Found ${usersResponse.data?.length || 0} users`);
    if (usersResponse.data && usersResponse.data.length > 0) {
      const firstUser = usersResponse.data[0];
      console.log(`   First user: ${firstUser.id} (${firstUser.attributes.email})`);
    }

    console.log('\n✨ All API client tests passed!');
    console.log('\n📝 Your Keygen TypeScript API client is working correctly.');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`   - ${err.title}: ${err.detail}`);
      });
    }
    process.exit(1);
  }
}

// Run the test
testApiClient();