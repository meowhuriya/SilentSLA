import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Reset Demo API
app.post('/api/reset', async (req, res) => {
  await prisma.claim.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.sLAPolicy.deleteMany();
  res.json({ success: true });
});

// AI Contract Extraction API
app.post('/api/extract-policy', async (req, res) => {
  const { contractText } = req.body;
  if (!contractText) return res.status(400).json({ error: 'contractText required' });

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Extract the SLA terms from the following contract text. Return ONLY a valid JSON object with these exact keys: serviceName (string), vendor (string), availabilityTarget (number, e.g. 99.9), measurementPeriod (string, e.g., "MONTHLY").\n\nContract Text:\n${contractText}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Ensure unique creation or return existing
    let policy = await prisma.sLAPolicy.findUnique({ where: { serviceName: parsed.serviceName } });
    if (!policy) {
      policy = await prisma.sLAPolicy.create({ data: parsed });
    }
    
    return res.status(201).json(policy);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Standard Ingestion API for Policies
app.post('/api/policies', async (req, res) => {
  try {
    const PolicySchema = z.object({
      serviceName: z.string(),
      vendor: z.string(),
      availabilityTarget: z.number(),
      measurementPeriod: z.string()
    });
    
    const parsed = PolicySchema.parse(req.body);
    const policy = await prisma.sLAPolicy.create({ data: parsed });
    return res.status(201).json(policy);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

// Dashboard APIs
app.get('/api/policies', async (req, res) => {
  const policies = await prisma.sLAPolicy.findMany();
  res.json(policies);
});

app.get('/api/incidents', async (req, res) => {
  const incidents = await prisma.incident.findMany({ orderBy: { startTime: 'desc' }});
  res.json(incidents);
});

app.get('/api/claims', async (req, res) => {
  const claims = await prisma.claim.findMany({
    include: { slaPolicy: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(claims);
});

// Mock Vendor Submission API
app.post('/api/vendor/submit-claim', async (req, res) => {
  const { claimId } = req.body;
  if (!claimId) return res.status(400).json({ error: 'claimId required' });

  // Simulate vendor reasoning (80% approval chance)
  const isApproved = Math.random() > 0.2;
  const newStatus = isApproved ? 'APPROVED' : 'REJECTED';

  try {
    const claim = await prisma.claim.update({
      where: { id: claimId },
      data: { status: newStatus }
    });

    res.json({ 
      success: true, 
      claim, 
      vendorMessage: isApproved 
        ? 'Claim accepted. Credits will be applied next billing cycle.' 
        : 'Claim denied. Outage fell within scheduled maintenance window or lacked evidence.' 
    });
  } catch (err) {
    res.status(500).json({ error: 'Claim not found.' });
  }
});

// Ingestion API for Incidents
app.post('/api/incidents', async (req, res) => {
  try {
    const IncidentSchema = z.object({
      serviceName: z.string(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime().optional(),
      evidenceSource: z.string(),
    });

    const parsed = IncidentSchema.parse(req.body);

    const policy = await prisma.sLAPolicy.findUnique({
      where: { serviceName: parsed.serviceName },
    });

    if (!policy) {
      return res.status(404).json({ error: 'SLA Policy not found for service' });
    }

    let durationMinutes = null;
    if (parsed.endTime) {
      const start = new Date(parsed.startTime).getTime();
      const end = new Date(parsed.endTime).getTime();
      durationMinutes = (end - start) / 1000 / 60;
    }

    const incident = await prisma.incident.create({
      data: {
        slaPolicyId: policy.id,
        startTime: new Date(parsed.startTime),
        endTime: parsed.endTime ? new Date(parsed.endTime) : null,
        durationMinutes,
        evidenceSource: parsed.evidenceSource,
      },
    });

    const currentDate = new Date();
    const allIncidents = await prisma.incident.findMany({
      where: { slaPolicyId: policy.id }
    });

    const { evaluateBreach } = await import('./evaluator');
    const { generateClaimText } = await import('./claimGenerator');

    const evalResult = evaluateBreach(policy, allIncidents, currentDate);

    if (evalResult.isBreach) {
      console.log(`[BREACH DETECTED] Policy ${policy.id} has breached SLA!`);
      
      const year = currentDate.getUTCFullYear();
      const month = currentDate.getUTCMonth();
      const windowIncidents = allIncidents.filter(inc => 
        inc.startTime.getUTCFullYear() === year && inc.startTime.getUTCMonth() === month
      );

      const claimText = await generateClaimText(
        policy, 
        windowIncidents, 
        evalResult.totalDowntimeMinutes, 
        evalResult.allowedDowntimeMinutes
      );

      const claim = await prisma.claim.create({
        data: {
          slaPolicyId: policy.id,
          totalDowntime: evalResult.totalDowntimeMinutes,
          claimPackage: claimText,
          status: 'GENERATED',
        }
      });

      console.log(`[CLAIM GENERATED] Claim ID: ${claim.id}`);
      return res.status(201).json({ incident, claim, breach: true });
    }

    return res.status(201).json({ incident, breach: false });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SilentSLA service running on http://localhost:${PORT}`);
});
