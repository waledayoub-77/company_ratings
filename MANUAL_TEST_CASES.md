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
| 1 | Open http://localhost:5173/company-admin#requests | Page loads, Employees tab is active | [P ] |
| 2 | Look for "Invite Employee" heading or section | "Invite Employee" heading is visible | [P ] |
| 3 | Look for an email input field | Email input is visible with placeholder e.g. "Email address" | [P ] |
| 4 | Look for a "Send Invite" button | "Send Invite" button is visible and clickable | [P ] |

---

## TC-1.2 — Successfully Invite a Registered User

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#requests  
**Note:** The invited email must belong to an already-registered account.

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [P ] |
| 2 | In the email input, type `carol@ratehub.com` | Email is typed | [P ] |
| 3 | Click "Send Invite" button | Request is submitted | [P ] |
| 4 | Observe the response | Success toast/message appears OR "already pending" message if already invited | [P- instead of alert or popup do soft message under invite button ] |
| 5 | Scroll to the Pending Invites section | Carol's invite appears with status "Pending" | [P ] |

**Notes:**  
`| 4 | Observe the response | Success toast/message appears OR "already pending" message if already invited | [P- instead of alert or popup do soft message under invite button `

---

## TC-1.3 — Pending Invite Visible to Company Admin

**Pre-condition:** At least one invite has been sent (see TC-1.2)  
**URL:** http://localhost:5173/company-admin#requests

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [P ] |
| 2 | Locate the "Pending Invites" section | Section is visible | [P ] |
| 3 | Verify the pending invite shows the employee's email | Email is displayed correctly | [ P] |
| 4 | Verify a "Discard" or "Cancel" button exists per invite | Discard/Cancel button is visible | [ P] |

**Notes:**  
`in compant admin dshboard -> employees tab, remove employment request where admin can approve or reject it beacuse we already have a section in bottom pending employees with discard button`

---

## TC-1.4 — Pending Invite Visible to the Invited Employee

**Pre-condition:** carol@ratehub.com has been invited  
**URL:** http://localhost:5173/dashboard (logged in as carol)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log out, then log in as `carol@ratehub.com` | Login succeeds | [P ] |
| 2 | Navigate to Dashboard → Invitations section (or check notification | Invitation from TechCorp is visible | [F - email issent to the email in emails app but no invitation tab in employee dashboard so that employee can not see pending or accepted status ] |
| 3 | Verify invitation status shows "Pending" | Status is "Pending" | [S ] |
| 4 | Verify an "Accept" button is present | Accept button is shown | [S ] |
| 5 | Verify there is NO "Reject" button | Reject/Decline button does NOT exist | [S ] |

**Notes:**  
`An email is being sent to the employee email but no invitation tab that appears in it pending or accepted for the employee`

---

## TC-1.5 — Employee Accepts Invitation

**Pre-condition:** carol@ratehub.com has a pending invite  
**URL:** http://localhost:5173/dashboard (logged in as carol)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log in as `carol@ratehub.com` | Login succeeds | [P ] |
| 2 | Find the pending invitation from TechCorp | Invitation is visible | [in email not in employee dashboard ] |
| 3 | Click "Accept" | Request submitted | [P - accepted from email not from dashboard because no invitation tab in employee dashboard ] |
| 4 | Observe the result | Success message appears; invitation status changes to "Accepted" / "Active" | [S - i cant see because invitation tab is not available in dashboard ] |
| 5 | Log out, log back in as `tech.admin@ratehub.com` and open Employees tab | Carol now appears in the approved employees list | [P ] |

**Notes:**  
`Company admin can not send invitation to email that already in an employment `

---

## TC-1.6 — Company Admin Discards an Invitation

**Pre-condition:** A pending invite exists in the Employees tab  
**URL:** http://localhost:5173/company-admin#requests

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [P ] |
| 2 | Find a pending invite | Invite is visible | [ ] |
| 3 | Click the "Discard" / "Cancel" button for that invite | A confirmation or immediate removal happens | [P ] |
| 4 | Verify the invite disappears from the list | Invite is gone from Company Admin view | [P ] |
| 5 | Log in as the invited employee and check their Invitations | Invitation is NOT visible to the employee | [P ] |

**Notes:**  
`In employee dashboard -> employment tab invitation will appear here but it apperes with pending or discard i need just pending and approve employee can not discard an invitation also employee can not be in two employment at same time`

---

## TC-1.7 — Duplicate Invitation Prevention (API)

**Pre-condition:** frank@ratehub.com is already employed at TechCorp

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab is active | [P ] |
| 2 | In the email input, type `frank@ratehub.com` | Email is typed | [P ] |
| 3 | Click "Send Invite" | Request submitted | [P ] |
| 4 | Observe the response | A soft error message appears: e.g. "This employee is already in the company" or "Already pending" | [P ] |
| 5 | Verify NO new invite was created | The invite does NOT appear as a new pending invite | [P ] |

**Notes:**  
`instead of alert or poopup just a small message under the invite button`

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
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab loads | [P ] |
| 2 | Click "End Employment" on any employee | **Important:** No browser `confirm()` / popup dialog appears | [P ] |
| 3 | Observe the page | An inline confirmation message appears ON the page, e.g. "Are you sure you want to end employment for [Name]?" | [P ] |
| 4 | Verify "Confirm" and "Cancel" buttons appear inline | Both buttons are visible within the page (not a modal popup) | [P ] |

**Notes:**  
`________________________________`

---

## TC-2.3 — Confirmation Has Reason Input

**Pre-condition:** Inline confirmation is open from TC-2.2

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | After clicking "End Employment", observe the expanded section | A reason/note text input is visible | [F- reason is not visible in company dashboard -> employees tab after ended, and in employee dashboard ->employment also reason is not appearing ] |
| 2 | Verify "Confirm" button exists | "Confirm" button is visible | [P ] |
| 3 | Verify "Cancel" button exists | "Cancel" button is visible | [P ] |
| 4 | Type a reason in the input | Text is accepted | [P ] |

---

## TC-2.4 — Cancel Closes Confirmation Without Changes

**Pre-condition:** Inline confirmation is open

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Click "End Employment" to open the confirmation | Confirmation appears with reason input | [P ] |
| 2 | Click "Cancel" | Confirmation form collapses/hides | [P ] |
| 3 | Verify the employee is still in the active list | Employee is unchanged | [P ] |
| 4 | Verify the reason input is no longer visible | Input is hidden | [P ] |

---

## TC-2.5 — Ending an Employee Changes Their Status

**Pre-condition:** A test/disposable employee exists (use with caution on real data)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#requests | Employees tab loads | [P ] |
| 2 | Click "End Employment" on chosen employee | Inline confirmation appears | [P ] |
| 3 | Optionally fill in a reason, then click "Confirm" | Success message appears; employee removed from active list | [employee still in list with all other employees, we can make a section for ended employees instead of leaving them in same list, also in company admin dashboard-> employees tab there is approved,rejected words in green and red add to them ended when employee is ended  ] |
| 4 | Verify that employee is no longer in the active employees list | Employee is gone | [F  ] |
| 5 | Log in as that employee and navigate to Employment History | Shows status as "Ended" with a date and the company name | [F date appears but ended status instead of approved no ] |

**Notes:**  
`________________________________`

---

## TC-2.6 — Ended Employee Cannot Submit Feedback

**Pre-condition:** Employee has been ended from the company (TC-2.5 completed)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Log in as the ended employee | Login succeeds | [P ] |
| 2 | Navigate to the Feedback section | Feedback page loads | [P ] |
| 3 | Attempt to submit feedback to the company | Submit button is disabled OR an error message appears: "You are no longer an employee of this company" | [F- after i am ended from this emploment and company I can still send feedback to the company ] |
| 4 | Attempt to submit feedback to a coworker at that company | Submit is blocked with similar message | [S ] |

**Notes:**  
`________________________________`

---

## TC-2.7 — Employment History Is Visible to Employee

**Pre-condition:** Logged in as frank@ratehub.com  
**URL:** http://localhost:5173/dashboard?tab=employment

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=employment | Employment tab loads | [P ] |
| 2 | Look for "Employment History" heading | Heading is visible | [P ] |
| 3 | Verify at least one employment record is shown | One or more employment entries are displayed | [P ] |

---

---

# FEATURE 3: Job Posting & Application System

---

## TC-3.1 — Company Admin Creates a Job Position

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads; "Job Positions" heading visible | [P ] |
| 2 | Click "New Position" button | A form/modal opens | [P ] |
| 3 | Fill in "Job Title" field with "Senior QA Engineer" | Text is accepted | [P ] |
| 4 | Fill in "Description" field with a description | Text is accepted | [P ] |
| 5 | Fill in "Requirements" field | Text is accepted | [P ] |
| 6 | Click "Create" / "Post Job" | Form submits | [P ] |
| 7 | Observe result | Success message shown; new job appears in the Jobs list | [P ] |

**Notes:**  
`________________________________`

---

## TC-3.2 — New Job Is Visible on Company Profile (Public)

**Pre-condition:** Job "Senior QA Engineer" was created in TC-3.1

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open a new incognito/guest browser window | No user is logged in | [P ] |
| 2 | Navigate to the Companies listing page | Companies are listed | [P ] |
| 3 | Click on "TechCorp" company profile | Company profile opens | [P ] |
| 4 | Scroll to "Open Positions" section | Section is visible | [P ] |
| 5 | Verify "Senior QA Engineer" appears | Job is listed publicly | [P ] |

**Notes:**  
`________________________________`

---

## TC-3.3 — Guest Sees "Log In to Apply" When Clicking Apply

**Pre-condition:** At least one job is posted publicly  
**URL:** http://localhost:5173/companies (as guest)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Navigate to a company's Open Positions (not logged in) | Jobs are listed with "Apply" buttons | [F - apply button is not appearing at all ] |
| 2 | Click "Apply" on any job | A message appears: "Please log in to apply" OR redirect to login page | [S ] |
| 3 | Verify the application was NOT submitted | No application created | [S ] |

**Notes:**  
`Apply button is not appering at all neither for gustes or logged in users`

---

## TC-3.4 — Employee Job Board Shows Active Jobs

**Pre-condition:** Logged in as frank@ratehub.com  
**URL:** http://localhost:5173/dashboard?tab=jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=jobs | Job Board tab loads | [P ] |
| 2 | Wait for spinner to disappear | Loading completes | [ P] |
| 3 | Verify "Open Positions" section is visible | Jobs are listed | [P ] |
| 4 | Verify "My Applications" section is visible | Section is shown (may be empty) | [ S - because apply button is not shown at all] |
| 5 | Verify all listed jobs have "Apply" or "Applied" button/badge | Each job card has an action indicator | [S ] |

---

## TC-3.5 — Employee Applies to a Job

**Pre-condition:** Logged in as frank@ratehub.com, at least one open job exists  
**URL:** http://localhost:5173/dashboard?tab=jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=jobs | Job Board loads | [P ] |
| 2 | Find a job with an "Apply" button | Job is visible | [F - no apply button is visible at all ] |
| 3 | Click "Apply" | Application form/modal opens | [F - no apply button is visible at all  ] |
| 4 | Fill in cover letter / upload CV if required | Fields accepted | [ S - because no apply button is visible at all ] |
| 5 | Click "Submit Application" | Request sent | [S - because no apply button is visible at all ] |
| 6 | Observe result | Success message: "Application submitted successfully" | [S - because no apply button is visible at all ] |
| 7 | Scroll to "My Applications" section | New application appears with status "Pending" | [S - because no apply button is visible at all ] |

**Notes:**  
`Apply button should appear under the job position openings in each company then employee can apply, employee with already employment or current employment or he is already in a company he can not apply to other company unless he end from a company `

---

## TC-3.6 — Company Admin Views Applications for a Position

**Pre-condition:** At least one application exists (TC-3.5 completed)  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [P ] |
| 2 | Find the job that was applied to | Job is listed | [P ] |
| 3 | Click "Applications" button on that job | Applications list expands / navigates | [S - because no apply button is visible at all ] |
| 4 | Verify applicant's name is visible | Name shown | [S - because no apply button is visible at all ] |
| 5 | Verify applicant's email is visible | Email shown | [S - because no apply button is visible at all, so no applications are avilable ] |
| 6 | Verify CV/Resume link is accessible (if uploaded) | Download link exists | [S - because no apply button is visible at all ] |
| 7 | Verify "Ignore" and "Accept" action buttons exist per applicant | Both buttons are present | [S - because no apply button is visible at all ] |

**Notes:**  
`________________________________`

---

## TC-3.7 — Company Admin Ignores an Application

**Pre-condition:** Application list is open (TC-3.6)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | In the applications list, click "Ignore" on an applicant | Request sent | [S - because no apply button is visible at all ] |
| 2 | Observe result | Application status changes to "Ignored"; may be removed from pending list | [ S - because no apply button is visible at all] |
| 3 | Verify it optionally moves to an "Archived/Ignored" section | Archived view exists (optional feature) | [S - because no apply button is visible at all ] |

**Notes:**  
`________________________________`

---

## TC-3.8 — Company Admin Accepts an Application → Interview Process

**Pre-condition:** Pending application exists (TC-3.6)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | In the applications list, click "Accept" on an applicant | Request sent | [S - because no apply button is visible at all ] |
| 2 | Observe result | Application moves to "Interview Process" section | [S - because no apply button is visible at all ] |
| 3 | Verify an "Invite" button appears in the Interview Process section | "Invite" button is visible | [ S - because no apply button is visible at all] |
| 4 | Verify Interview Process shows applicant info (name, email, CV) | Info is displayed | [ S - because no apply button is visible at all] |
| 5 | Verify Interview Status shows "In Progress" | Status is correct | [ S - because no apply button is visible at all] |

**Notes:**  
`________________________________`

---

## TC-3.9 — Company Admin Sends Invite From Interview Process

**Pre-condition:** Application is in Interview Process with "Invite" button visible (TC-3.8)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | In the Interview Process section, click "Invite" | Invitation is sent | [S - because no apply button is visible at all ] |
| 2 | Observe result | Success message: "Invitation sent" | [S - because no apply button is visible at all ] |
| 3 | Navigate to Employees tab | New pending invite visible for that applicant | [S - because no apply button is visible at all ] |
| 4 | Log in as the applicant, check their invitations | Invitation from TechCorp is visible | [S - because no apply button is visible at all ] |

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
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [P ] |
| 2 | Verify "Job Positions" heading is visible | Heading is shown | [P ] |
| 3 | Verify each job row shows: Position Title | Title is visible | [P ] |
| 4 | Verify each job row shows: Applications count | Count is shown | [ S - because no apply button is visible at all so that no one can apply] |
| 5 | Verify each job row shows: "Applications" button | Button is visible | [(button is vissible but no one appears because i cant test because apply button is not appearing) S - because no apply button is visible at all so that no employees applied so i can not test ] |
| 6 | Verify each open job row shows: "Close" button | Close button is visible for open jobs | [ P] |

---

## TC-4.2 — Create → Verify → Close → Verify Closed (Full Cycle)

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Click "New Position" and create a job titled "Temp Closure Test" | Job created successfully | [P ] |
| 2 | Verify job appears in the Jobs list with status Open | Job is visible; `is_active = true` | [ P] |
| 3 | Navigate to Employee Job Board (/dashboard?tab=jobs as frank) | "Temp Closure Test" is visible in Open Positions | [ P] |
| 4 | Go back to Company Admin Jobs tab | Jobs tab is active | [P ] |
| 5 | Click "Close" on "Temp Closure Test" | Confirmation appears | [ P] |
| 6 | Confirm the close action | Success message shown; job is removed from the active list | [P ] |
| 7 | Verify the job is NOT visible in the admin Jobs tab open list | Job does not appear in open positions | [P ] |
| 8 | Navigate to Employee Job Board again | "Temp Closure Test" is NOT visible to employees | [ P] |

**Notes:**  
`________________________________`

---

## TC-4.3 — Closed Job Does Not Appear in Employee Job Board

**Pre-condition:** At least one job has been closed (TC-4.2)  
**URL:** http://localhost:5173/dashboard?tab=jobs (logged in as frank)

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard?tab=jobs | Job Board loads | [P ] |
| 2 | Verify all displayed jobs are open/active | No closed or inactive job appears in the list | [P ] |
| 3 | Search for the closed job title if search is available | Closed job is NOT found | [P - no search for a job is available, add search a job when user search for a job it will appear only job that he searched for] |

---

## TC-4.4 — Close Position Confirmation Dialog

**Pre-condition:** At least one open job exists  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [ P] |
| 2 | Click "Close" on any open position | A confirmation message appears: "Are you sure you want to close this position? It will no longer be visible to applicants." | [F - when i press close it will removed (closed) directly] |
| 3 | Click "No" / "Cancel" | Dialog closes; job remains open | [S ] |
| 4 | Verify the job is still in the open positions list | Job is unchanged | [S] |

---

## TC-4.5 — Delete Position Requires Browser Confirmation

**Pre-condition:** Logged in as Company Admin  
**URL:** http://localhost:5173/company-admin#jobs

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/company-admin#jobs | Jobs tab loads | [P ] |
| 2 | Find a delete/trash icon button on any job | Delete button is visible | [ P] |
| 3 | Click the trash icon | Browser `confirm()` dialog appears | [ P- cahnge alert to soft message under the button] |
| 4 | Click "Cancel" in the browser dialog | Dialog closes; job is NOT deleted | [ P] |
| 5 | Verify the job is still listed | Job unchanged | [P ] |

---

---

# CROSS-FEATURE & INTEGRATION TESTS

---

## TC-INT.1 — Company Profile Page Shows Employee Count

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Navigate to the Companies listing page | Companies are listed | [ ]P |
| 2 | Click on any company | Company profile opens | [ P] |
| 3 | Find the "Employees" count/label | "Employees" label with a number is visible | [P ] |

---

## TC-INT.2 — Dashboard Tab Deep Links Work

**Pre-condition:** Logged in as frank@ratehub.com

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Navigate directly to http://localhost:5173/dashboard?tab=jobs | Job Board tab is active and shown | [ P] |
| 2 | Navigate directly to http://localhost:5173/dashboard?tab=feedback | Feedback tab is active and shown | [P ] |
| 3 | Navigate directly to http://localhost:5173/dashboard?tab=employment | Employment History tab is active and shown | [ P] |
| 4 | Navigate directly to http://localhost:5173/company-admin#requests | Company Admin Employees tab is active | [P ] |
| 5 | Navigate directly to http://localhost:5173/company-admin#jobs | Company Admin Jobs tab is active | [P ] |

---

## TC-INT.3 — Notification Bell Opens Panel

**Pre-condition:** Logged in as any user

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open the Dashboard | Navbar is visible | [P ] |
| 2 | Click the bell/notification icon in the navbar | Notification panel opens | [ P] |
| 3 | Verify the panel shows notifications OR a "No notifications" message | Panel content is shown | [ P] |

---

## TC-INT.4 — EOTM Tab (Employee of the Month)

**Pre-condition:** Logged in as frank@ratehub.com

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard | Dashboard loads | [P ] |
| 2 | Click the "EOTM" tab | EOTM content loads | [P ] |
| 3 | Verify NO "0 votes" text is displayed | "0 votes" does not appear anywhere on the tab | [F- as an employee I can see 0 votes , i want to remove it at all i do not want to see as an employee 0 votes ] |

---

## TC-INT.5 — EOTY Tab (Employee of the Year)

**Pre-condition:** Logged in as frank@ratehub.com

| # | Step | Expected Result | Result |
|---|------|----------------|--------|
| 1 | Open http://localhost:5173/dashboard | Dashboard loads | [P ] |
| 2 | Click the "EOTY" tab | EOTY content loads | [P ] |
| 3 | Verify NO "0 votes" text is displayed | "0 votes" does not appear anywhere on the tab | [ F- as an employee I can see 0 votes , i want to remove it at all i do not want to see as an employee 0 votes ] |

note: employee of the month and employee of the year (winner can take a certificate or screenshot of the hall because his namae appears on it and under his name the number of votes he got)