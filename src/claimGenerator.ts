import { GoogleGenAI } from '@google/genai';
import { SLAPolicy, Incident } from '@prisma/client';

export async function generateClaimText(
  policy: SLAPolicy, 
  incidents: Incident[], 
  totalDowntimeMinutes: number, 
  allowedDowntimeMinutes: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Generating a mock claim for testing.");
    return `[MOCK CLAIM]\nVendor: ${policy.vendor}\nService: ${policy.serviceName}\nBreach: ${totalDowntimeMinutes} mins > ${allowedDowntimeMinutes} mins.\nAction: Automated claim generation fallback.`;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an SLA Credit Recovery Agent. Your job is to draft a professional, vendor-facing service-credit claim.

**Policy Details:**
- Vendor: ${policy.vendor}
- Service: ${policy.serviceName}
- SLA Target: ${policy.availabilityTarget}%
- Allowed Downtime: ${allowedDowntimeMinutes.toFixed(2)} minutes

**Incident Evidence (Aggregated over window):**
Total Eligible Downtime: ${totalDowntimeMinutes.toFixed(2)} minutes

**Incident Chronology:**
${incidents.map(i => `- Started: ${i.startTime.toISOString()}, Duration: ${i.durationMinutes} mins, Evidence: ${i.evidenceSource}`).join('\n')}

**Task:**
Draft a clear, factual claim requesting service credits. Cite the total downtime vs allowed downtime, and list the chronological evidence. DO NOT hallucinate any incidents not listed above. Keep it concise.
`;

  const modelsToTry = ['gemini-3.8-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

  for (const model of modelsToTry) {
    try {
      console.log(`[AI] Attempting claim generation with ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response.text || 'Error generating claim.';
    } catch (error: any) {
      console.error(`[AI] Error with ${model}:`, error.message);
      if (error.status !== 503) {
        // If it's not a server overload, don't keep trying models
        break;
      }
    }
  }

  return `[MOCK CLAIM - ALL AI MODELS BUSY]\nVendor: ${policy.vendor}\nService: ${policy.serviceName}\nBreach: ${totalDowntimeMinutes} mins > ${allowedDowntimeMinutes} mins.\nAction: Automated claim generation fallback.`;
}
