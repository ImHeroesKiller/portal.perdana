# PT Perdana Adi Yuda - Security Rules Specification

## 1. Data Invariants
- Candidates must provide a valid `nik` (Indonesian Citizen National ID), `fullName`, and `email` on registration.
- An employee's record belongs to themselves. All candidate PII (phone, bank details, files, etc.) must remain secure.
- Admin role can view, write, and update all records (recruits, companies, jobs, projects).
- Anonymous reads on `jobs` is permitted for public listing.
- Writes on `employees` (creates/submissions) is public for new candidates.
- Modifying a candidate's `status` or updating corporate `clients`/`projects` is strictly restricted to authenticated administrators.

## 2. The "Dirty Dozen" Payloads (Aesthetic Security Audit)
1. **Malicious ID injection**: Attempt to write an employee with id containing characters like `/../../../` or >1KB string length to lock up storage queries.
2. **Identity Escalation**: Client attempts to create an admin document inside their own session or assign themselves roles.
3. **Ghost Fields**: Attempt to append random unapproved flags like `isVerifiedBySystem: true` to bypass verification rules.
4. **PII Data Scraping**: Attempting to read another candidate’s personal files (e.g. `bankName`, `accountNumber`) without being authenticated as the owner or an administrator.
5. **Unauthorized Status Modification**: A regular candidate tries to change their status to `'HIRED'` or `'OFFERING'`.
6. **Temporal Attack**: Attempt to backdate or fake the `createdAt` timestamp to years ago.
7. **System Fields Modification**: Modifying system parameters or internal audits of the HR notes.
8. **Client Spoofing**: Attempt to delete or edit valid `clients` from unauthorized client SDKs.
9. **Project Hijacking**: Attempt to create a project mapped to a non-existent clientId.
10. **Null Pointer Triggering**: Accessing resources with null auth properties in read-restrictive rules.
11. **Spamming Job Openings**: Unauthorized creation of random job vacancies.
12. **Recursive Cost-Explosion (Denial of Wallet)**: Performing complex queries that loop through heavy DB items in unbounded lists.

## 3. Test Assertions
All "Dirty Dozen" attacks from untrusted actors must receive a strict `PERMISSION_DENIED` rejection from the Firestore Security layer.
