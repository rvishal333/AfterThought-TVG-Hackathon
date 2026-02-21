import type { ProjectType, ProjectEffect } from '../types/grid';

const MORPH_API_URL = '/api/morph/chat/completions';
const MODEL = 'morph-v3-large';

function getApiKey(): string {
    const key = (import.meta as any).env.VITE_MORPH_API_KEY as string | undefined;
    if (!key) throw new Error('VITE_MORPH_API_KEY is not set in .env');
    return key;
}

// ─── Build the prompt for project effect generation ──────────────────────────

function buildPrompt(
    projectName: string,
    description: string,
    zoneName: string,
    budgetM: number,
): string {
    return `You are an expert energy grid infrastructure analyst. A utility planner is proposing a custom infrastructure project. Based on the project details, determine what type of project this is and estimate its effects on the grid simulation.

PROJECT DETAILS:
- Name: ${projectName}
- Description: ${description}
- Target Zone: ${zoneName}
- Estimated Budget: $${budgetM}M

AVAILABLE PROJECT TYPES (pick the closest match):
substation_upgrade, solar_farm, battery_storage, grid_hardening, ev_charging, underground_cable, smart_meter, transmission_upgrade, community_microgrid, solar_storage, water_infrastructure, district_hvac, emergency_services, custom

AVAILABLE EFFECTS (all optional, only include relevant ones):
- capacityBoostMW: number (additional megawatt capacity, typical range 10-65 based on budget)
- vulnerabilityReduction: number 0-1 (how much zone vulnerability decreases, typical 0.10-0.35)
- demandReductionFactor: number 0-1 (demand reduction percentage, typical 0.06-0.12)
- cascadeResistance: number 0-1 (resistance to cascading failures, typical 0.15-0.50)
- recoverySpeedBoost: number 0-1 (faster recovery from outages, typical 0.2-0.8)
- utilityResilienceBoost: number 0-1 (water/HVAC resilience during outages, typical 0.45-0.75)

BUDGET GUIDELINES: Effects should scale with budget. A $10M project should have modest effects; a $40M+ project can have stronger effects. Be realistic.

Respond in the following JSON format ONLY (no markdown, no explanation):
{
  "type": "project_type_here",
  "effects": { ... only relevant effect fields ... },
  "refinedDescription": "A concise 1-sentence technical description of what this project does"
}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GeneratedProject {
    type: ProjectType;
    effects: ProjectEffect;
    refinedDescription: string;
}

// ─── API call ────────────────────────────────────────────────────────────────

export async function generateProjectEffects(
    projectName: string,
    description: string,
    zoneName: string,
    budgetM: number,
): Promise<GeneratedProject> {
    const apiKey = getApiKey();
    const prompt = buildPrompt(projectName, description, zoneName, budgetM);

    const response = await fetch(MORPH_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: 'You are an expert energy grid analyst. Always respond with valid JSON only, no markdown or explanation.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 400,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Morph API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    // Parse JSON from the response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Could not parse AI response as JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and clamp effects to reasonable ranges
    const effects: ProjectEffect = {};
    if (parsed.effects?.capacityBoostMW) effects.capacityBoostMW = Math.min(100, Math.max(0, Number(parsed.effects.capacityBoostMW)));
    if (parsed.effects?.vulnerabilityReduction) effects.vulnerabilityReduction = Math.min(1, Math.max(0, Number(parsed.effects.vulnerabilityReduction)));
    if (parsed.effects?.demandReductionFactor) effects.demandReductionFactor = Math.min(1, Math.max(0, Number(parsed.effects.demandReductionFactor)));
    if (parsed.effects?.cascadeResistance) effects.cascadeResistance = Math.min(1, Math.max(0, Number(parsed.effects.cascadeResistance)));
    if (parsed.effects?.recoverySpeedBoost) effects.recoverySpeedBoost = Math.min(1, Math.max(0, Number(parsed.effects.recoverySpeedBoost)));
    if (parsed.effects?.utilityResilienceBoost) effects.utilityResilienceBoost = Math.min(1, Math.max(0, Number(parsed.effects.utilityResilienceBoost)));

    const validTypes: ProjectType[] = [
        'substation_upgrade', 'solar_farm', 'battery_storage', 'grid_hardening',
        'ev_charging', 'underground_cable', 'smart_meter', 'transmission_upgrade',
        'community_microgrid', 'solar_storage', 'water_infrastructure', 'district_hvac',
        'emergency_services', 'custom',
    ];

    const type = validTypes.includes(parsed.type) ? parsed.type : 'custom';

    return {
        type,
        effects,
        refinedDescription: parsed.refinedDescription || description,
    };
}
