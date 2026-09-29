# Database Schema

We are using Prisma. Below is the conceptual schema to guide the implementation.

```prisma
// This is a conceptual guide. The AI should generate the actual Prisma schema based on this.

model SLAPolicy {
  id                  String     @id @default(uuid())
  serviceName         String     @unique // e.g., "Cloud-Managed Database"
  vendor              String
  availabilityTarget  Float      // e.g., 99.9 (percentage)
  measurementPeriod   String     // e.g., "MONTHLY"
  claims              Claim[]
  incidents           Incident[] 
}

model Incident {
  id                  String     @id @default(uuid())
  slaPolicyId         String
  slaPolicy           SLAPolicy  @relation(fields: [slaPolicyId], references: [id])
  startTime           DateTime
  endTime             DateTime?
  durationMinutes     Float?     // Calculated deterministically when resolved
  evidenceSource      String     // e.g., "Datadog Monitor ID-123"
  isExcluded          Boolean    @default(false) // e.g., scheduled maintenance
}

model Claim {
  id                  String     @id @default(uuid())
  slaPolicyId         String
  slaPolicy           SLAPolicy  @relation(fields: [slaPolicyId], references: [id])
  totalDowntime       Float      // The calculated aggregate downtime
  claimPackage        String     // The LLM-generated markdown/JSON payload
  status              String     // "GENERATED", "SUBMITTED", "APPROVED", "REJECTED"
  createdAt           DateTime   @default(now())
}
```
