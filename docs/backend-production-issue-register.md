# Backend production issue register

This register is read-only documentation for the backend team. It records confirmed compatibility concerns observed against backend commit `09ea1f5b906b2c336f71edc3cdc07b760766eee1`. It does not prescribe frontend financial rules and does not authorize database, migration, permission, scheduler, or deployment changes.

## 1. Gross-versus-net invoice inconsistency

- **Severity:** P1 — financial integrity.
- **Sources:** `src/controllers/invoice.controller.js`, `calculateInvoiceAmountsFromTenant`; `src/controllers/paymentReport.controller.js`, `computeExpectedChargesForPolicy` and `createPaymentReport` (`createMissingInvoices` branch); `src/services/rentCalculation.js`, `calculateTotalPaymentWithWithholding`.
- **Reproduction:** Configure a tenant with withholding tax, then compare (a) an invoice created through the invoice endpoint with (b) the invoice automatically created while recording a payment with no open invoice and `createMissingInvoices=true` for the same billing period.
- **Expected:** One approved accounting rule determines the invoice face value in every creation path. Gross invoice total, withholding, net payable, payment allocation, balance, and PDF should reconcile.
- **Actual:** Manual invoice generation deliberately uses the gross total before withholding. The payment-recording fallback creates an invoice with `expected.totalDue`, which is the net amount after withholding, while placing `totalDueWithoutWithholding` only in notes.
- **Impact:** Invoice totals and balances can differ based on workflow; reports, receipts, arrears, settlement status, and audit evidence can disagree.
- **Investigation:** Obtain accounting approval for the authoritative invoice face value. Trace every invoice creation entry point and centralize the approved calculation without changing historical records silently. Define how withholding is represented and allocated.
- **Acceptance tests:**
  1. For identical tenant configuration and period, manual and payment-triggered invoices have identical approved totals and line items.
  2. Gross, withholding, net payable, amount paid, and balance reconcile for monthly, quarterly, and annual policies.
  3. Exempt and zero-withholding tenants retain current totals.
  4. Retries do not create duplicate invoices.
  5. Invoice PDFs and payment previews present the same approved meanings.

## 2. Missing report-download permission provisioning

- **Severity:** P1 — authorization/provisioning.
- **Sources:** `src/services/permissionService.js`, `operations.paymentReport` and `canDownloadReportForProperty`; report and WhatsApp controllers that request `DOWNLOAD_PAYMENT_REPORT`, `DOWNLOAD_BILL_REPORT`, and `DOWNLOAD_COMPREHENSIVE_REPORT`; `migrations/seed.js`, permission catalogue.
- **Reproduction:** Create or edit a custom role through the normal permission catalogue and attempt to grant the three report-download permissions to a managed user.
- **Expected:** Every permission enforced by report endpoints is present in the authoritative permission catalogue and can be assigned, persisted, returned in the profile, and enforced per property.
- **Actual:** The service maps and controllers enforce the three codes, but the normal seed catalogue does not define them. Admin/manager bypasses may work, while managed roles cannot be provisioned consistently.
- **Impact:** Authorized managed users can be unable to receive report access; UI controls remain hidden and direct calls return `403` even when the business intends access.
- **Investigation:** Confirm canonical code names, category, scope, default role assignments, and upgrade strategy for existing environments. Provision through the backend's approved permission-data process rather than a frontend workaround.
- **Acceptance tests:**
  1. All three codes appear once in the permission catalogue.
  2. A custom role can receive and revoke each permission independently.
  3. Profile/permission refresh returns the assigned codes.
  4. Authorized users can download only reports for accessible properties.
  5. Unauthorized and cross-property requests remain `403`.

## 3. Outdated PM2 scheduler entry point

- **Severity:** P1 — production operations.
- **Sources:** `ecosystem.config.cjs`, scheduler app; `package.json`, `scheduler` script; `src/jobs/runner.js`; `src/jobs/index.js`; `src/jobs/reminderJob.js`; `src/jobs/prepaidToPaidCron.js`.
- **Reproduction:** Start the application using the checked-in PM2 ecosystem configuration and inspect scheduler logs/process behavior.
- **Expected:** The scheduler process executes the combined runner, registers reminder and PREPAID-transition jobs exactly once, handles shutdown signals, and emits startup/health evidence.
- **Actual:** PM2 points at `src/jobs/reminderJob.js`, which exports registration functions but does not invoke the combined job startup. The package scheduler command correctly points at `src/jobs/runner.js`.
- **Impact:** Reminders and PREPAID-to-PAID transitions may never run under PM2, leaving financial presentation stale and time-based workflows incomplete.
- **Investigation:** Align the production process definition with the approved combined runner. Confirm single-instance behavior, environment flags, time zone, run-on-start policy, monitoring, and restart semantics.
- **Acceptance tests:**
  1. PM2 startup logs show both job families registered once.
  2. A controlled due PREPAID record transitions once at the expected Nairobi schedule.
  3. Reminder jobs execute at configured Nairobi times without duplication.
  4. Restart and graceful shutdown stop old cron tasks before replacement.
  5. Disabling a job by environment configuration prevents its execution.

## 4. Future-dated freeze lifecycle inconsistency

- **Severity:** P1 — workflow and financial controls.
- **Sources:** `src/controllers/tenant.controller.js`, `freezeTenant`, `unfreezeTenant`, tenant statistics, and `buildLifecycleMetadata`; `src/services/tenantFreeze.js`, `isTenantFrozenOn`, `getFreezePeriodFor`, and `isTenantFrozenNow`.
- **Reproduction:** Freeze an active tenant with a start date in the future. Inspect `tenant.isFrozen`, current effective status, statistics, lifecycle metadata, repeat-freeze behavior, and then attempt to cancel/unfreeze before the start date.
- **Expected:** A future freeze has an explicit scheduled state, does not count as currently frozen, cannot overlap or duplicate contrary to policy, and has a supported cancellation/rescheduling path if the business permits one.
- **Actual:** Creating the future period immediately writes `tenant.isFrozen=true`, while authoritative period checks say the tenant is not currently frozen. Current unfreeze rejects the request, another future period may be accepted, and boolean-based statistics can count the tenant as frozen.
- **Impact:** UI and reports can disagree; scheduled freezes may be impossible to cancel; duplicate future periods may create ambiguous financial restrictions.
- **Investigation:** Define the lifecycle state machine and overlap rules first. Decide whether `isFrozen` means current, current-or-scheduled, or should be derived. Add an explicit approved cancellation/reschedule contract if required, then align statistics and lifecycle metadata.
- **Acceptance tests:**
  1. Future, active, completed, cancelled, and open-ended periods resolve consistently across detail, list, statistics, invoice, and payment APIs.
  2. Scheduling does not mark a tenant currently frozen unless that is the approved definition.
  3. Overlapping/duplicate periods are rejected or handled according to an explicit rule.
  4. An approved cancellation/reschedule workflow works before the start date.
  5. Freeze boundaries behave correctly at Nairobi day/month/year boundaries.
  6. Invoice and payment restrictions apply only to billing periods covered by the authoritative freeze period.
