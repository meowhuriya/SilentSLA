import { describe, it, expect } from 'vitest';
import { calculateAllowedDowntimeMinutes, evaluateBreach } from './evaluator';
import { SLAPolicy, Incident } from '@prisma/client';

describe('Policy Evaluator', () => {
  it('calculates allowed downtime correctly for a 30-day month at 99.9%', () => {
    // April 2024 has 30 days -> 43200 minutes
    // 99.9% uptime means 0.1% downtime -> 43.2 minutes
    const date = new Date('2024-04-15T00:00:00Z');
    const allowed = calculateAllowedDowntimeMinutes(99.9, 'MONTHLY', date);
    
    expect(allowed).toBeCloseTo(43.2, 1);
  });

  it('detects a breach when cumulative downtime exceeds allowed', () => {
    const policy: SLAPolicy = {
      id: 'p1',
      serviceName: 'Test DB',
      vendor: 'CloudCo',
      availabilityTarget: 99.9,
      measurementPeriod: 'MONTHLY'
    };

    const date = new Date('2024-04-15T00:00:00Z');
    
    const incidents: Incident[] = [
      {
        id: 'i1',
        slaPolicyId: 'p1',
        startTime: new Date('2024-04-01T10:00:00Z'),
        endTime: new Date('2024-04-01T10:10:00Z'),
        durationMinutes: 10,
        evidenceSource: 'log',
        isExcluded: false
      },
      {
        id: 'i2',
        slaPolicyId: 'p1',
        startTime: new Date('2024-04-05T10:00:00Z'),
        endTime: new Date('2024-04-05T10:35:00Z'),
        durationMinutes: 35,
        evidenceSource: 'log',
        isExcluded: false
      }
    ];

    // Total = 45 mins. Allowed = 43.2 mins. Should breach!
    const result = evaluateBreach(policy, incidents, date);
    
    expect(result.totalDowntimeMinutes).toBe(45);
    expect(result.isBreach).toBe(true);
  });

  it('does not breach if downtime is under threshold', () => {
    const policy: SLAPolicy = {
      id: 'p1',
      serviceName: 'Test DB',
      vendor: 'CloudCo',
      availabilityTarget: 99.9,
      measurementPeriod: 'MONTHLY'
    };

    const date = new Date('2024-04-15T00:00:00Z');
    
    const incidents: Incident[] = [
      {
        id: 'i1',
        slaPolicyId: 'p1',
        startTime: new Date('2024-04-01T10:00:00Z'),
        endTime: new Date('2024-04-01T10:10:00Z'),
        durationMinutes: 10,
        evidenceSource: 'log',
        isExcluded: false
      }
    ];

    const result = evaluateBreach(policy, incidents, date);
    
    expect(result.totalDowntimeMinutes).toBe(10);
    expect(result.isBreach).toBe(false);
  });
  
  it('ignores excluded incidents', () => {
    const policy: SLAPolicy = {
      id: 'p1',
      serviceName: 'Test DB',
      vendor: 'CloudCo',
      availabilityTarget: 99.9,
      measurementPeriod: 'MONTHLY'
    };

    const date = new Date('2024-04-15T00:00:00Z');
    
    const incidents: Incident[] = [
      {
        id: 'i1',
        slaPolicyId: 'p1',
        startTime: new Date('2024-04-01T10:00:00Z'),
        endTime: null,
        durationMinutes: 50,
        evidenceSource: 'log',
        isExcluded: true // e.g. Customer caused
      }
    ];

    const result = evaluateBreach(policy, incidents, date);
    
    expect(result.totalDowntimeMinutes).toBe(0);
    expect(result.isBreach).toBe(false);
  });
});
