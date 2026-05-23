#!/usr/bin/env node
const autocannon = require('autocannon');
const target = process.env.STRESS_TEST_URL || 'http://localhost:5000/api/health';
const connections = parseInt(process.env.STRESS_TEST_CONNECTIONS || '20', 10);
const duration = parseInt(process.env.STRESS_TEST_DURATION || '10', 10);

console.log(`Starting stress test: ${target}`);
console.log(`Connections: ${connections}, Duration: ${duration}s`);

const instance = autocannon({
  url: target,
  connections,
  duration,
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
}, (err, result) => {
  if (err) {
    console.error('Stress test failed:', err);
    process.exit(1);
  }
  console.log('\nStress test complete:\n');
  console.log(result);
});

process.once('SIGINT', () => instance.stop());
