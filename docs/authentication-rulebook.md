# Real AMS Authentication Rulebook

This rulebook uses least privilege by default. A user should see the smallest
set of sections and fields needed for their job, and sensitive fields should be
masked even when they live inside an otherwise allowed page.

## Roles

| Role | Intent |
| --- | --- |
| Administration | Club operations, player administration, player biography, player care management, and non-clinical welfare operations. |
| Technical Staff | Full football staff access. Can view medical, performance, biography, care, financial, calendar, and source context. |
| Medical and Performance Director | Full director-level access across medical, performance, biography, care, financial, calendar, and source context. |
| Medical Staff | Medical team access. Can view medical records, injury context, recovery context, player care, and non-financial biography. |
| Performance Staff | Performance team access. Can view load, testing, physical development, readiness context, player care, and non-financial biography. |
| Medical and Performance Staff | Cross-functional medical/performance access. Can view both medical and performance context, but not financial context. |

## Data Domains

| Domain | Includes | Sensitivity |
| --- | --- | --- |
| Biography | Name, number, position, nationality, DOB, height, weight, roster identity, profile image. | Low to moderate |
| Player Care Management | Non-clinical care tasks, appointments, welfare follow-ups, logistics, support notes. | Moderate |
| Medical | Injuries, days lost, body region, rehab detail, clinical notes, return-to-play medical status. | High |
| Performance | GPS load, match/training load, testing, FMS/Y-Balance/VALD, fatigue/readiness metrics. | High |
| Financial | Salary, market value, contract end, transfer/agent information, bonuses, financial valuation. | High |
| Technical | Team plans, match context, tactical/football calendar, player availability for selection. | Moderate to high |
| Source Registry | Raw source previews, sync audit, connected system metadata, player registry completeness. | High |
| System Settings | App settings, source visibility, access configuration, integration controls. | High |

## Role Access Rules

| Section / Data | Administration | Technical Staff | Medical and Performance Director | Medical Staff | Performance Staff | Medical and Performance Staff |
| --- | --- | --- | --- | --- | --- | --- |
| Player Biography | Allow | Allow | Allow | Allow, financial fields masked | Allow, financial fields masked | Allow, financial fields masked |
| Player Care Management | Allow | Allow | Allow | Allow | Allow | Allow |
| Medical / Injury | Deny | Allow | Allow | Allow | Deny, except availability summaries | Allow |
| Performance / Load / Testing | Deny | Allow | Allow | Deny, except rehab-relevant summaries | Allow | Allow |
| Body Composition | Deny | Allow | Allow | Allow | Allow | Allow |
| Recovery / RTP | Deny clinical detail; allow care logistics only | Allow | Allow | Allow | Allow non-clinical and performance-return context | Allow |
| Financial Fields | Allow only inside biography/care context | Allow | Allow | Deny | Deny | Deny |
| Calendar | Care/logistics categories only | Allow | Allow | Medical/care categories only | Performance/care categories only | Medical/performance/care categories only |
| External Factors | Deny by default | Allow | Allow | Allow if medical/travel risk relevant | Allow | Allow |
| Source Registry / Raw Sources | Deny | Allow | Allow | Deny by default | Deny by default | Deny by default |
| Settings | Deny | Allow | Allow | Deny | Deny | Deny |

## Section Mapping

| App Section | Primary Domain | Notes |
| --- | --- | --- |
| Home / Overview | Mixed | Must be filtered by role because it can expose medical and performance summaries. |
| Load Demand | Performance | Deny to Administration. |
| Injury History | Medical | Deny to Administration and Performance-only staff. |
| Physical Development | Performance | Deny to Administration. |
| Body Composition | Medical + Performance | Deny to Administration. |
| Recovery | Medical + Performance + Care | Administration should only see future care-management summaries, not clinical rehab detail. |
| Biography | Biography + Financial | Medical/performance staff can see biography but financial fields must be masked. |
| External Factors | Technical + Performance Context | Treat travel/weather as performance context unless used for care logistics. |
| Athlete Profile | Medical + Performance Decision Support | Deny to Administration. |
| Calendar | Mixed | Filter events by category and department. |
| Resources | Mixed | Filter resources by tags/domains. |
| Settings | Source Registry + System Settings | Limit to Technical Staff and Medical/Performance Director until system-admin roles exist. |

## Field-Level Masking Rules

Financial fields must be masked for Medical Staff, Performance Staff, and Medical
and Performance Staff, even when those fields appear inside an allowed page.

Current financial field examples:

- `contractExpires`
- `marketValue`
- `contractProgress`
- future `salary`
- future `bonus`
- future `transferValue`
- future `agent`

Medical/performance staff should see `"Restricted"` or an equivalent empty state,
not the true value.

## Implementation Rules

1. Never rely only on hidden navigation. Protect both page rendering and API/data access.
2. Apply page-level checks first, then field-level masking inside allowed pages.
3. Treat raw source previews as high sensitivity because they can bypass UI masking.
4. Calendar and Resources must be filtered by category/domain tags, not shown wholesale.
5. Technical Staff and Medical and Performance Director are the only current full-access roles.
6. Administration is not a medical/performance role. It can see biography, financial biography fields, and player care management, but not load, injury, testing, body composition, clinical recovery, or source previews.
7. Medical/performance staff can see the medical/performance data they need, but never financial fields.
