async function run() {
  const baseUrl = 'http://localhost:3000/api';

  console.log("1. Creating SLA Policy (99.9% availability -> ~43 mins allowed downtime/month)");
  const polRes = await fetch(`${baseUrl}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName: 'Core Database',
      vendor: 'CloudVendor Inc.',
      availabilityTarget: 99.9,
      measurementPeriod: 'MONTHLY'
    })
  });
  
  const policy = await polRes.json();
  console.log(policy);

  console.log("\n2. Simulating Micro-outage #1 (10 mins) - No claim expected.");
  let date = new Date(); // now
  const inc1 = await fetch(`${baseUrl}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName: 'Core Database',
      startTime: new Date(date.getTime() - 10 * 60000).toISOString(),
      endTime: date.toISOString(),
      evidenceSource: 'Datadog Monitor #1123'
    })
  });
  console.log(await inc1.json());

  console.log("\n3. Simulating Micro-outage #2 (30 mins) - No claim expected. (Total 40 mins)");
  const inc2 = await fetch(`${baseUrl}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName: 'Core Database',
      startTime: new Date(date.getTime() - 40 * 60000).toISOString(),
      endTime: new Date(date.getTime() - 10 * 60000).toISOString(),
      evidenceSource: 'Datadog Monitor #1124'
    })
  });
  console.log(await inc2.json());

  console.log("\n4. Simulating Micro-outage #3 (5 mins) - Breaches the ~43 min threshold! (Total 45 mins)");
  const inc3 = await fetch(`${baseUrl}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName: 'Core Database',
      startTime: new Date(date.getTime() - 45 * 60000).toISOString(),
      endTime: new Date(date.getTime() - 40 * 60000).toISOString(),
      evidenceSource: 'Customer Support Ticket #8812'
    })
  });
  const result = await inc3.json();
  console.log(result);

  if (result.breach && result.claim) {
    console.log("\n=============================");
    console.log("   AUTOMATED CLAIM PACKAGE   ");
    console.log("=============================\n");
    console.log(result.claim.claimPackage);
  }
}

run().catch(console.error);
