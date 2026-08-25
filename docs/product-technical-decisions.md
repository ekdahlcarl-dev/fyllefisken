# FylleFisken — Product & Technical Decision Record

This document records the approved WP1 decisions and is the version-controlled implementation baseline for FylleFisken.

Approved by the project owner on 2026-08-25.

## Architecture

- **Frontend/application:** Next.js App Router with TypeScript
- **Hosting:** Vercel with preview deployments
- **Data and authentication:** Supabase Postgres plus invite-only email authentication
- **Security:** Row Level Security; no public sign-up; only approved friends can sign in
- **Scoring:** One shared, server-side calculation module used by every view
- **Design:** Mobile-first Scandinavian outdoor aesthetic; large touch targets for waterside entry; MAJO and Torsk have distinct accessible team colors

## Data model

- users and memberships
- teams (MAJO, Torsk)
- competitions/seasons
- competition days
- catches (team, day, pike length, creator, timestamps)
- yearly winners from 2011 onward
- catch photos / yearly memories handled separately from scoring data

Daily and three-day results are always derived from catches, never stored as manually editable totals.

## Scoring rules

Each competition day awards **2 points**:

1. **Longest pike of the day:** 1 point
2. **Daily Big Five:** 1 point for the greatest combined length of that team's five longest pike caught that day

Across all three competition days, **2 additional points** are awarded:

1. **Longest pike across all three days:** 1 point
2. **Three-day Big Five:** 1 point for the greatest combined length of that team's five longest pike across all three days

Maximum competition score: **8 points**.

The total length of all catches is a displayed statistic only and awards no points.

### Ties

- A tied one-point scoring category awards **0.5 points to Team MAJO and 0.5 points to Team Torsk**.
- If the final competition score is tied, the team with the longest pike across all three days wins.
- If that fish is also tied, compare the second-longest pike per team, then third-longest, and continue until the tie is broken.
- If every comparable catch is identical, the competition result is recorded as a true tie rather than inventing another rule.

## Roles and permissions

- **Members:** all invited signed-in friends may view all competition data and enter catches.
- **Catch correction:** a member may edit/delete catches they created while the competition day is open.
- **Admins:** may correct any catch, manage seasons/days, historical winners, invitations and locked data.
- Authorization must be enforced server-side and with Supabase Row Level Security, not only in the UI.

## Measurement and validation

- Pike length is stored in **centimeters with one decimal place**.
- Valid range for normal entry: **10.0–150.0 cm**.
- Values outside that range are rejected by default; an admin-only correction path may be added later if real historical data requires it.

## Photos

Proof/catch photos are not required to calculate scores. Photo support is planned through WP10, and scoring must never depend on a photo being present.

## Seasons

- A competition consists of exactly three competition days.
- Admins can create the next annual season in the UI; no code change should be required for annual rollover.
- Exact calendar dates remain season configuration rather than hardcoded application logic.

## Visual direction

- Mobile-first, outdoor/fishing-focused Scandinavian look
- Fast waterside interaction with large touch targets
- High contrast and readable in daylight
- Team MAJO and Team Torsk have distinct accessible visual identities
- Avoid relying on color alone to indicate team or winner state
- Initial logo treatment: typographic FylleFisken wordmark; richer logo/artwork can be introduced later without blocking application development

## Version 1 scope

Included:

- Invite-only access
- MAJO vs Torsk annual three-day competition
- Catch entry and correction
- Big Five and longest-pike scoring
- Live daily and overall results
- Winners archive from 2011
- Admin season management
- Catch photos and yearly memories gallery
- Production deployment on Vercel

Deferred unless needed during implementation:

- Public registration/public leaderboards
- More than two competing teams
- Native iOS/Android apps
- Offline-first synchronization
- Payments or commercial functionality
- Advanced social features

## Page map / mobile flow

1. Sign in
2. Competition home / live scoreboard
3. Add catch
4. Day detail and catch list
5. Overall results
6. History / winners
7. Photos / memories
8. Admin area (admins only)

Primary mobile action from the competition home is **Add catch**.

## WP1 acceptance criteria

- [x] Architecture and hosting approach approved
- [x] Complete scoring rules and tie handling defined
- [x] Roles and permissions baseline approved
- [x] Data model approved
- [x] Mobile page map approved as implementation baseline
- [x] Version-1 scope and deferred ideas recorded
- [x] Decision record committed to the repository
