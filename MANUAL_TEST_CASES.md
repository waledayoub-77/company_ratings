# Manual Test Cases — Company Ratings Platform
> Based on `PROJECT_FEATURES_FLOW.txt`  
> Last updated: March 8, 2026

---

## Test Environment

| Item | Value |
|------|-------|
| Frontend URL | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Browser | Chrome (latest) |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Employee | frank@ratehub.com | Test1234! |
| Company Admin | tech.admin@ratehub.com | Test1234! |
| System Admin | admin@ratehub.com | Test1234! |
| Registered (no company) | carol@ratehub.com | Test1234! |

---

## How to Use This Document

- **[ ]** = Not tested yet  
- **[P]** = Passed  
- **[F]** = Failed — note the actual result below the step  
- **[S]** = Skipped (pre-condition not met)

---

---

# FEATURE 1: Employee Invitation System

---

## TC-1.1 — Employees Section Has Invite Form

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#requests

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Page loads, Employees tab is active | [ ] |
| 2 | Look for "Invite Employee" heading or section | "Invite Employee" heading is visible | [ ] |
| 3 | Look for an email input field | Email input is visible with placeholder e.g. "Email address" | [ ] |
| 4 | Look for a "Send Invite" button | "Send Invite" button is visible and clickable | [ ] |

---

## TC-1.2 — Successfully Invite a Registered User

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#requests  
**Note:** The invited email must belong to an already-registered account.

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [ ] |
| 2 | In the email input, type `carol@ratehub.com` | Email is typed | [ ] |
| 3 | Click "Send Invite" button | Request is submitted | [ ] |
| 4 | Observe the response | Success toast/message appears OR "already pending" message if already invited | [ ] |
| 5 | Scroll to the Pending Invites section | Carol's invite appears with status "Pending" | [ ] |

**Notes:**  
`________________________________`

---

## TC-1.3 — Pending Invite Visible to Company Admin

**Pre-condition:** At least one invite has been sent (see TC-1.2)  
**URL:** http://localhost:5173/company-admin#requests

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [ ] |
| 2 | Locate the "Pending Invites" section | Section is visible | [ ] |
| 3 | Verify the pending invite shows the employee's email | Email is displayed correctly | [ ] |
| 4 | Verify a "Discard" or "Cancel" button exists per invite | Discard/Cancel button is visible | [ ] |

---

## TC-1.4 — Pending Invite Visible to the Invited Employee

**Pre-condition:** carol@ratehub.com has been invited  
**URL:** http://localhost:5173/dashboard (logged in as carol)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log out, then log in as `carol@ratehub.com` | Login succeeds | [ ] |
| 2 | Navigate to Dashboard → Invitations section (or check notification | Invitation from TechCorp is visible | [ ] |
| 3 | Verify invitation status shows "Pending" | Status is "Pending" | [ ] |
| 4 | Verify an "Accept" button is present | Accept button is shown | [ ] |
| 5 | Verify there is NO "Reject" button | Reject/Decline button does NOT exist | [ ] |

**Notes:**  
`________________________________`

---

## TC-1.5 — Employee Accepts Invitation

**Pre-condition:** carol@ratehub.com has a pending invite  
**URL:** http://localhost:5173/dashboard (logged in as carol)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log in as `carol@ratehub.com` | Login succeeds | [ ] |
| 2 | Find the pending invitation from TechCorp | Invitation is visible | [ ] |
| 3 | Click "Accept" | Request submitted | [ ] |
| 4 | Observe the result | Success message appears; invitation status changes to "Accepted" / "Active" | [ ] |
| 5 | Log out, log back in as `tech.admin@ratehub.com` and open Employees tab | Carol now appears in the approved employees list | [ ] |

**Notes:**  
`________________________________`

---

## TC-1.6 — Company Admin Discards an Invitation

**Pre-condition:** A pending invite exists in the Employees tab  
**URL:** http://localhost:5173/company-admin#requests

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [ ] |
| 2 | Find a pending invite | Invite is visible | [ ] |
| 3 | Click the "Discard" / "Cancel" button for that invite | A confirmation or immediate removal happens | [ ] |
| 4 | Verify the invite disappears from the list | Invite is gone from Company Admin view | [ ] |
| 5 | Log in as the invited employee and check their Invitations | Invitation is NOT visible to the employee | [ ] |

**Notes:**  
`________________________________`

---

## TC-1.7 — Duplicate Invitation Prevention (API)

**Pre-condition:** frank@ratehub.com is already employed at TechCorp

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [ ] |
| 2 | In the email input, type `frank@ratehub.com` | Email is typed | [ ] |
| 3 | Click "Send Invite" | Request submitted | [ ] |
| 4 | Observe the response | A soft error message appears: e.g. "This employee is already in the company" or "Already pending" | [ ] |
| 5 | Verify NO new invite was created | The invite does NOT appear as a new pending invite | [ ] |

**Notes:**  
`________________________________`

---

---

# FEATURE 2: End Employee

---

## TC-2.1 — End Employee Button Is Visible

**Pre-condition:** Logged in as Company Admin, at least one approved employee  
**URL:** http://localhost:5173/company-admin#requests

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab loads | [ ] |
| 2 | Scroll to the approved/active employees list | Employees are listed | [ ] |
| 3 | Look at each employee row | An "End Employment" button is visible per employee | [ ] |

---

## TC-2.2 — End Employee Shows Inline Confirmation (Not Browser Popup)

**Pre-condition:** At least one approved employee exists  
**URL:** http://localhost:5173/company-admin#requests

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab loads | [ ] |
| 2 | Click "End Employment" on any employee | **Important:** No browser `confirm()` / popup dialog appears | [ ] |
| 3 | Observe the page | An inline confirmation message appears ON the page, e.g. "Are you sure you want to end employment for [Name]?" | [ ] |
| 4 | Verify "Confirm" and "Cancel" buttons appear inline | Both buttons are visible within the page (not a modal popup) | [ ] |

**Notes:**  
`________________________________`

---

## TC-2.3 — Confirmation Has Reason Input

**Pre-condition:** Inline confirmation is open from TC-2.2

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | After clicking "End Employment", observe the expanded section | A reason/note text input is visible | [ ] |
| 2 | Verify "Confirm" button exists | "Confirm" button is visible | [ ] |
| 3 | Verify "Cancel" button exists | "Cancel" button is visible | [ ] |
| 4 | Type a reason in the input | Text is accepted | [ ] |

---

## TC-2.4 — Cancel Closes Confirmation Without Changes

**Pre-condition:** Inline confirmation is open

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Click "End Employment" to open the confirmation | Confirmation appears with reason input | [ ] |
| 2 | Click "Cancel" | Confirmation form collapses/hides | [ ] |
| 3 | Verify the employee is still in the active list | Employee is unchanged | [ ] |
| 4 | Verify the reason input is no longer visible | Input is hidden | [ ] |

---

## TC-2.5 — Ending an Employee Changes Their Status

**Pre-condition:** A test/disposable employee exists (use with caution on real data)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab loads | [ ] |
| 2 | Click "End Employment" on chosen employee | Inline confirmation appears | [ ] |
| 3 | Optionally fill in a reason, then click "Confirm" | Success message appears; employee removed from active list | [ ] |
| 4 | Verify that employee is no longer in the active employees list | Employee is gone | [ ] |
| 5 | Log in as that employee and navigate to Employment History | Shows status as "Ended" with a date and the company name | [ ] |

**Notes:**  
`________________________________`

---

## TC-2.6 — Ended Employee Cannot Submit Feedback

**Pre-condition:** Employee has been ended from the company (TC-2.5 completed)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log in as the ended employee | Login succeeds | [ ] |
| 2 | Navigate to the Feedback section | Feedback page loads | [ ] |
| 3 | Attempt to submit feedback to the company | Submit button is disabled OR an error message appears: "You are no longer an employee of this company" | [ ] |
| 4 | Attempt to submit feedback to a coworker at that company | Submit is blocked with similar message | [ ] |

**Notes:**  
`________________________________`

---

## TC-2.7 — Employment History Is Visible to Employee

**Pre-condition:** Logged in as frank@ratehub.com  
**URL:** http://localhost:5173/dashboard?tab=employment

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=employment | Employment tab loads | [ ] |
| 2 | Look for "Employment History" heading | Heading is visible | [ ] |
| 3 | Verify at least one employment record is shown | One or more employment entries are displayed | [ ] |

---

---

# FEATURE 3: Job Posting & Application System

---

## TC-3.1 — Company Admin Creates a Job Position

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads; "Job Positions" heading visible | [ ] |
| 2 | Click "New Position" button | A form/modal opens | [ ] |
| 3 | Fill in "Job Title" field with "Senior QA Engineer" | Text is accepted | [ ] |
| 4 | Fill in "Description" field with a description | Text is accepted | [ ] |
| 5 | Fill in "Requirements" field | Text is accepted | [ ] |
| 6 | Click "Create" / "Post Job" | Form submits | [ ] |
| 7 | Observe result | Success message shown; new job appears in the Jobs list | [ ] |

**Notes:**  
`________________________________`

---

## TC-3.2 — New Job Is Visible on Company Profile (Public)

**Pre-condition:** Job "Senior QA Engineer" was created in TC-3.1

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open a new incognito/guest browser window | No user is logged in | [ ] |
| 2 | Navigate to the Companies listing page | Companies are listed | [ ] |
| 3 | Click on "TechCorp" company profile | Company profile opens | [ ] |
| 4 | Scroll to "Open Positions" section | Section is visible | [ ] |
| 5 | Verify "Senior QA Engineer" appears | Job is listed publicly | [ ] |

**Notes:**  
`________________________________`

---

## TC-3.3 — Guest Sees "Log In to Apply" When Clicking Apply

**Pre-condition:** At least one job is posted publicly  
**URL:** http://localhost:5173/companies (as guest)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Navigate to a company's Open Positions (not logged in) | Jobs are listed with "Apply" buttons | [ ] |
| 2 | Click "Apply" on any job | A message appears: "Please log in to apply" OR redirect to login page | [ ] |
| 3 | Verify the application was NOT submitted | No application created | [ ] |

**Notes:**  
`________________________________`

---

## TC-3.4 — Employee Job Board Shows Active Jobs

**Pre-condition:** Logged in as frank@ratehub.com  
**URL:** http://localhost:5173/dashboard?tab=jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=jobs | Job Board tab loads | [ ] |
| 2 | Wait for spinner to disappear | Loading completes | [ ] |
| 3 | Verify "Open Positions" section is visible | Jobs are listed | [ ] |
| 4 | Verify "My Applications" section is visible | Section is shown (may be empty) | [ ] |
| 5 | Verify all listed jobs have "Apply" or "Applied" button/badge | Each job card has an action indicator | [ ] |

---

## TC-3.5 — Employee Applies to a Job

**Pre-condition:** Logged in as frank@ratehub.com, at least one open job exists  
**URL:** http://localhost:5173/dashboard?tab=jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=jobs | Job Board loads | [ ] |
| 2 | Find a job with an "Apply" button | Job is visible | [ ] |
| 3 | Click "Apply" | Application form/modal opens | [ ] |
| 4 | Fill in cover letter / upload CV if required | Fields accepted | [ ] |
| 5 | Click "Submit Application" | Request sent | [ ] |
| 6 | Observe result | Success message: "Application submitted successfully" | [ ] |
| 7 | Scroll to "My Applications" section | New application appears with status "Pending" | [ ] |

**Notes:**  
`________________________________`

---

## TC-3.6 — Company Admin Views Applications for a Position

**Pre-condition:** At least one application exists (TC-3.5 completed)  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [ ] |
| 2 | Find the job that was applied to | Job is listed | [ ] |
| 3 | Click "Applications" button on that job | Applications list expands / navigates | [ ] |
| 4 | Verify applicant's name is visible | Name shown | [ ] |
| 5 | Verify applicant's email is visible | Email shown | [ ] |
| 6 | Verify CV/Resume link is accessible (if uploaded) | Download link exists | [ ] |
| 7 | Verify "Ignore" and "Accept" action buttons exist per applicant | Both buttons are present | [ ] |

**Notes:**  
`________________________________`

---

## TC-3.7 — Company Admin Ignores an Application

**Pre-condition:** Application list is open (TC-3.6)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | In the applications list, click "Ignore" on an applicant | Request sent | [ ] |
| 2 | Observe result | Application status changes to "Ignored"; may be removed from pending list | [ ] |
| 3 | Verify it optionally moves to an "Archived/Ignored" section | Archived view exists (optional feature) | [ ] |

**Notes:**  
`________________________________`

---

## TC-3.8 — Company Admin Accepts an Application → Interview Process

**Pre-condition:** Pending application exists (TC-3.6)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | In the applications list, click "Accept" on an applicant | Request sent | [ ] |
| 2 | Observe result | Application moves to "Interview Process" section | [ ] |
| 3 | Verify an "Invite" button appears in the Interview Process section | "Invite" button is visible | [ ] |
| 4 | Verify Interview Process shows applicant info (name, email, CV) | Info is displayed | [ ] |
| 5 | Verify Interview Status shows "In Progress" | Status is correct | [ ] |

**Notes:**  
`________________________________`

---

## TC-3.9 — Company Admin Sends Invite From Interview Process

**Pre-condition:** Application is in Interview Process with "Invite" button visible (TC-3.8)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | In the Interview Process section, click "Invite" | Invitation is sent | [ ] |
| 2 | Observe result | Success message: "Invitation sent" | [ ] |
| 3 | Navigate to Employees tab | New pending invite visible for that applicant | [ ] |
| 4 | Log in as the applicant, check their invitations | Invitation from TechCorp is visible | [ ] |

**Notes:**  
`________________________________`

---

---

# FEATURE 4: Job Position Management

---

## TC-4.1 — Admin Sees List of Job Positions With Action Buttons

**Pre-condition:** Logged in as Company Admin, at least one job exists  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [ ] |
| 2 | Verify "Job Positions" heading is visible | Heading is shown | [ ] |
| 3 | Verify each job row shows: Position Title | Title is visible | [ ] |
| 4 | Verify each job row shows: Applications count | Count is shown | [ ] |
| 5 | Verify each job row shows: "Applications" button | Button is visible | [ ] |
| 6 | Verify each open job row shows: "Close" button | Close button is visible for open jobs | [ ] |

---

## TC-4.2 — Create → Verify → Close → Verify Closed (Full Cycle)

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Click "New Position" and create a job titled "Temp Closure Test" | Job created successfully | [ ] |
| 2 | Verify job appears in the Jobs list with status Open | Job is visible; `is_active = true` | [ ] |
| 3 | Navigate to Employee Job Board (/dashboard?tab=jobs as frank) | "Temp Closure Test" is visible in Open Positions | [ ] |
| 4 | Go back to Company Admin Jobs tab | Jobs tab is active | [ ] |
| 5 | Click "Close" on "Temp Closure Test" | Confirmation appears | [ ] |
| 6 | Confirm the close action | Success message shown; job is removed from the active list | [ ] |
| 7 | Verify the job is NOT visible in the admin Jobs tab open list | Job does not appear in open positions | [ ] |
| 8 | Navigate to Employee Job Board again | "Temp Closure Test" is NOT visible to employees | [ ] |

**Notes:**  
`________________________________`

---

## TC-4.3 — Closed Job Does Not Appear in Employee Job Board

**Pre-condition:** At least one job has been closed (TC-4.2)  
**URL:** http://localhost:5173/dashboard?tab=jobs (logged in as frank)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=jobs | Job Board loads | [ ] |
| 2 | Verify all displayed jobs are open/active | No closed or inactive job appears in the list | [ ] |
| 3 | Search for the closed job title if search is available | Closed job is NOT found | [ ] |

---

## TC-4.4 — Close Position Confirmation Dialog

**Pre-condition:** At least one open job exists  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [ ] |
| 2 | Click "Close" on any open position | A confirmation message appears: "Are you sure you want to close this position? It will no longer be visible to applicants." | [ ] |
| 3 | Click "No" / "Cancel" | Dialog closes; job remains open | [ ] |
| 4 | Verify the job is still in the open positions list | Job is unchanged | [ ] |

---

## TC-4.5 — Delete Position Requires Browser Confirmation

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [ ] |
| 2 | Find a delete/trash icon button on any job | Delete button is visible | [ ] |
| 3 | Click the trash icon | Browser `confirm()` dialog appears | [ ] |
| 4 | Click "Cancel" in the browser dialog | Dialog closes; job is NOT deleted | [ ] |
| 5 | Verify the job is still listed | Job unchanged | [ ] |

---

---

# CROSS-FEATURE & INTEGRATION TESTS

---

## TC-INT.1 — Company Profile Page Shows Employee Count

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Navigate to the Companies listing page | Companies are listed | [ ] |
| 2 | Click on any company | Company profile opens | [ ] |
| 3 | Find the "Employees" count/label | "Employees" label with a number is visible | [ ] |

---

## TC-INT.2 — Dashboard Tab Deep Links Work

**Pre-condition:** Logged in as frank@ratehub.com

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Navigate directly to http://localhost:5173/dashboard?tab=jobs | Job Board tab is active and shown | [ ] |
| 2 | Navigate directly to http://localhost:5173/dashboard?tab=feedback | Feedback tab is active and shown | [ ] |
| 3 | Navigate directly to http://localhost:5173/dashboard?tab=employment | Employment History tab is active and shown | [ ] |
| 4 | Navigate directly to http://localhost:5173/company-admin#requests | Company Admin Employees tab is active | [ ] |
| 5 | Navigate directly to http://localhost:5173/company-admin#jobs | Company Admin Jobs tab is active | [ ] |

---

## TC-INT.3 — Notification Bell Opens Panel

**Pre-condition:** Logged in as any user

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open the Dashboard | Navbar is visible | [ ] |
| 2 | Click the bell/notification icon in the navbar | Notification panel opens | [ ] |
| 3 | Verify the panel shows notifications OR a "No notifications" message | Panel content is shown | [ ] |

---

## TC-INT.4 — EOTM Tab (Employee of the Month)

**Pre-condition:** Logged in as frank@ratehub.com

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard | Dashboard loads | [ ] |
| 2 | Click the "EOTM" tab | EOTM content loads | [ ] |
| 3 | Verify NO "0 votes" text is displayed | "0 votes" does not appear anywhere on the tab | [ ] |

---

## TC-INT.5 — EOTY Tab (Employee of the Year)

**Pre-condition:** Logged in as frank@ratehub.com

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard | Dashboard loads | [ ] |
| 2 | Click the "EOTY" tab | EOTY content loads | [ ] |
| 3 | Verify NO "0 votes" text is displayed | "0 votes" does not appear anywhere on the tab | [ ] |

---

---

# REGRESSION: Core API Health Checks

These can be done using the browser's developer tools (Network tab) or a tool like Postman.

---

## TC-REG.1 — Login Returns Access Token

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | POST to `http://localhost:5000/api/auth/login` with `{"email":"frank@ratehub.com","password":"Test1234!"}` | HTTP 200; response contains `data.access_token` | [ ] |

---

## TC-REG.2 — Companies Endpoint Returns List

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | GET `http://localhost:5000/api/companies` (no auth) | HTTP 200; `data` is a non-empty array | [ ] |

---

## TC-REG.3 — Filter Options Endpoint

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | GET `http://localhost:5000/api/companies/filter-options` (no auth) | HTTP 200; response contains `data.countries` array and `data.cities` array | [ ] |

---

## TC-REG.4 — Jobs Endpoint Returns Active Jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log in, get access token | Token received | [ ] |
| 2 | GET `http://localhost:5000/api/jobs/all` with Bearer token | HTTP 200; `data` is a non-empty array; all items have `is_active: true` | [ ] |

---

## TC-REG.5 — Notifications Endpoint

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log in as frank, get token | Token received | [ ] |
| 2 | GET `http://localhost:5000/api/notifications` with Bearer token | HTTP 200; `data` is an array | [ ] |

---

## TC-REG.6 — Auth /me Returns User Profile

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log in as frank, get token | Token received | [ ] |
| 2 | GET `http://localhost:5000/api/auth/me` with Bearer token | HTTP 200; `data.user` object contains email | [ ] |

---

## TC-REG.7 — Unauthenticated Request Returns 401

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | GET `http://localhost:5000/api/notifications` with NO Authorization header | HTTP 401 Unauthorized | [ ] |

---

---

# Test Run Summary

| Date | Tester | Feature 1 | Feature 2 | Feature 3 | Feature 4 | Integration | Regression | Notes |
|------|--------|-----------|-----------|-----------|-----------|-------------|------------|-------|
| | | /7 | /7 | /9 | /5 | /5 | /7 | |
| | | /7 | /7 | /9 | /5 | /5 | /7 | |

---

*Total test cases: 40*
