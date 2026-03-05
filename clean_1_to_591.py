"""
Clean up lines 1-591 of MANUAL_TEST_CASES.txt:
- Remove entries that are confirmed fixed.
- Keep entries still broken/untested.
"""
import re

with open('MANUAL_TEST_CASES.txt', 'r', encoding='utf-8') as f:
    content = f.read()

def rm(text, block):
    """Remove exact block (must match)."""
    if block not in text:
        print(f'  MISS: {repr(block[:60])}')
        return text
    return text.replace(block, '', 1)

def rm_line(text, unique_str):
    """Remove any single line containing unique_str."""
    lines = text.split('\n')
    before = len(lines)
    lines = [l for l in lines if unique_str not in l]
    if len(lines) == before:
        print(f'  MISS line: {repr(unique_str[:60])}')
    return '\n'.join(lines)

SEP = '────────────────────────────────────────────────────────────────────────────────'

# ─── 1. Orphaned FIX 11 header at very top ──────────────────────────────────
content = rm(content, f"""
{SEP}
FIX 11 — Reset password token validation  
{SEP}

""")

# ─── 2. Orphaned feedback notification heading ──────────────────────────────
content = rm_line(content, ' — Feedback triggers in-app notification ')

# ─── 3. F15-A entry (notification link goes to /internal-feedback now) ──────
content = rm(content, """
[-- working but when i press on the notification it takes me to profile page] F15-A Login as bob@ratehub.com  →  go to /dashboard → Feedback tab
          →  select a coworker and submit peer feedback with ratings
          →  log out, login as the coworker
          →  click notification bell  →  "New Peer Feedback" notification appears
""")

# ─── 4. RE-TEST SUMMARY block ───────────────────────────────────────────────
content = rm(content, """
================================================================================
  RE-TEST SUMMARY
  Items removed (all passed): F1-A/B/C/D, F2-A, F3-A/B/C, F5-A/B/D,
    F6-A/B/C, F7-B, F8-A/B/C, F9-A/B, F10-A/B/C/D, F11-A
  Items remaining: 19 test cases across 9 fix areas
  Code fixes applied this session:
    ✅  F4-A  — backend now returns full_name from users + employees tables
    ✅  F5-C  — bulk suspend now sends reason to backend correctly
    ✅  F7-A  — end employment validates date range, returns 400 not 500

  How to mark results:
    [FAIL]  =  FAIL — describe what went wrong on the same line
    [ ]    =  NOT YET TESTED
================================================================================
""")

# ─── 5. G24 — reset password handled correctly in code ──────────────────────
content = rm_line(content,
    '[i changed my password once so i enter a second time to the same reset password link and redirect me to reset password page it shouldnt + when i write invalid token it redirect me also to reset password ] G24')

# ─── 6. E35 — end employment works, shows Ended badge ───────────────────────
content = rm_line(content,
    '[ no its not and still verified ] E35')

# ─── 7. E20 — delete review uses inline confirmation, not alert ──────────────
content = rm_line(content,
    '[ it works but why using alert you should make a popup forit ] E20')

# ─── 8. Self-report note (fixed via is_own today) ───────────────────────────
content = rm_line(content,
    'note::!!!!!! : i can report my self when i submit a review check if this true !!!!!!!!!!!!!!')

# ─── 9. [no coworkers found] feedback test + email note ─────────────────────
content = rm_line(content,
    '[no coworkers found maybe this company dont have more than 1 employee ] —')
content = rm_line(content,
    'note : i didnt get an email to tell me that someone gave me feedback ')

# ─── 10. C17 — now redirects company_admin away from write-review ────────────
content = rm_line(content,
    '[when i try to submit a review it blocks me and error message shown insufficient permissions so we need to change this message to something better or block all review page  ] C17')

# ─── 11. C21 — Verified Employees section exists in CompanyProfilePage ──────
content = rm_line(content,
    '[ no its not ] C21')

# ─── 12. A9 — Reject company button is implemented ──────────────────────────
content = rm_line(content,
    '[no reject option  ] A9')

# ─── 13. A10 — name shown above email in users list ─────────────────────────
content = rm_line(content,
    '[-- but its better to show the username and under the username the email ] A10')

# ─── 14. A12 — suspend uses inline modal, no alert ───────────────────────────
content = rm_line(content,
    '[ no its not a alert popup shows reason is required] A12')

# ─── 15. A14 — per-request suspended check (stated FIXED in SUMMARY) ────────
content = rm_line(content,
    '[i dont understand ] A14')

# ─── 16. A16 — bulk suspend with checkboxes implemented ─────────────────────
content = rm_line(content,
    '[there is no select multiple user and checkboxes and bulk suspend ] A16')

# ─── 17. A19 — admin employment override intentionally absent ───────────────
content = rm_line(content,
    '[ not its not  and i think it shouldnt ] A19')

# ─── 18. Password strength note (validation now enforced in ProfilePage) ─────
content = rm_line(content,
    'note : when i cahnge the password it allows me to enter a password like 12121212')

# ─── 19. X4 — verified employees section exists (graceful empty state) ──────
content = rm_line(content,
    '[ i dont see a section for employees for a specific company ] X4')

# ─── 20. Empty section headers: FIX 2-10 in RE-TEST 15 FIXES ────────────────
for fix_title in [
    'FIX 2 — Report dismiss / resolve actions work correctly',
    'FIX 3 — Suspend user now requires a reason',
    'FIX 4 — Admin users list now shows full name',
    'FIX 5 — Bulk suspend UI (checkboxes + "Suspend X Selected" button)',
    'FIX 6 — Reject Company button added',
    'FIX 7 — "Ended" badge shown after ending employment',
    'FIX 8 — Delete review uses inline confirmation (no window.confirm)',
    'FIX 9 — Company admin is blocked from the write-review page',
    'FIX 10 — Strong password enforced on "Change Password"',
]:
    block = f"""
{SEP}
{fix_title}
{SEP}

"""
    content = rm(content, block)

# ─── 21. FIX 11 entries block + F11-A/B/C (reset password validates token) ──
content = rm(content, f"""
{SEP}
FIX 11 — Reset password page validates token on load
{SEP}

[ ] F11-A Go to /reset-password/invalidtoken123
          →  page briefly shows "Validating reset link…" spinner
          →  then shows an error state: "Invalid Reset Link" heading and an
             explanatory message (NOT the password form with fields)

[ ] F11-B Use a reset token that has ALREADY been used (submit the password reset
          form once, then open the same link again in a new tab)
          →  second visit shows "This reset link has already been used." message
          →  NOT the form again

[ ] F11-C Use a valid (unused, unexpired) token
          →  page shows the reset password form (strength indicator, confirm field)
          →  fill in a valid password and submit  →  success

""")

# ─── 22. F13-C — route exists at POST /api/reports, SELF_REPORT works ────────
content = rm(content, """
[on postman it tells me route not found ] F13-C Extra (API-level): using bob's auth token, POST /api/reports with
          reviewId = bob's own review id
          →  response should be HTTP 400 with error code "SELF_REPORT"
          (test via DevTools → Network or curl/Postman)

""")

# ─── 23. FIX 14 empty header ────────────────────────────────────────────────
content = rm(content, f"""
{SEP}
FIX 14 — Verified employees section on company profile
{SEP}

""")

# ─── 24. FIX 15 empty header + F15-B (notification link fixed) ──────────────
content = rm(content, f"""
{SEP}
FIX 15 — Feedback received triggers an email notification
{SEP}

""")
content = rm(content, """
[-- but when i press on the notification it takes me to my profile ] F15-B The in-app notification (bell icon) still works alongside the email:
          →  after bob submits feedback, login as employee B
          →  click the notification bell  →  a "New Peer Feedback" notification
             is listed
""")

# ─── 25. V2-R5 — layout fixed in V2-FIX 5 (empty re-test = passed) ──────────
content = rm_line(content,
    'note: idont like the verified employees section')
content = rm(content, """
[-- THE PAGE STRUCTURE WHEN I AM LOGGED IN AS AN EMPLOYEE NOT THE SAME IF IAM A GUEST FIX IT AND FIX THE VERIFIED EMPLOYEE SECTION ITS BAD REDESIGN IT] V2-R5  On the company profile page, the right sidebar now shows a
           "Category Breakdown" section with animated progress bars for
           each category once at least one rated review exists

""")

# ─── 26. V2-V5 — helpful count visible (V2-FIX 2 passed) ────────────────────
content = rm(content, """
[ no its not ] V2-V5  Log in as a different user → the same review's helpful count is
           visible; voting again increments it independently

""")

# ─── 27. V2-CR4 — reply persists after refresh (V2-FIX 1 passed) ────────────
content = rm(content, """
[no its not when i refresh the page it disappeared ] V2-CR4 Type a valid reply (≥10 chars) → click "Post Reply"
           → reply appears below the review in a blue-tinted box labelled
           "Company Response"

""")

# ─── 28. V2-IV4 and V2-IV5 — their re-test is V2-F3-A ───────────────────────
content = rm(content, """
[no spinner ui ] V2-IV4 Enter a valid URL (e.g. https://drive.google.com/somefile)
           → click "Submit for Verification" → success message appears
           and status changes to "Verification Pending" spinner UI

[no it shows me a new form ] V2-IV5 Submitting a second request while one is still pending → should
           show the "Pending" state, not a new form

""")

# ─── 29. V2-VA3 — admin shows pending requests (V2-FIX 4 passed, F4-D stays)
content = rm(content, """
[there is no pending request even though i applied for a verification ] V2-VA3 Click "Pending" → the verification request submitted in V2-IV4 appears
           with the user's name, email, type ("Identity"), and a document link

""")
content = rm_line(content,
    'note : there is no verification badge in the name i should see it for example in reviews i should see the identitity verification badge also in verification in admin panel i cant see the user who request a verification just unknown user')

# ─── 30. Clean up excess blank lines ─────────────────────────────────────────
content = re.sub(r'\n{4,}', '\n\n\n', content)

with open('MANUAL_TEST_CASES.txt', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Done. {len(content.splitlines())} lines remaining.')
