# InterPark form date-picker and selection-control audit

Audit date: 10 November 2026

## Scope and method

This audit covers form controls reachable from the left-navigation application areas, including embedded property-workspace forms, dialogs, and detail-page child actions. It is based on the current local source tree rather than route labels alone.

Repository-wide source searches found:

- 17 native date-like controls across 12 files: 15 single-date fields, one `month` field, and one `datetime-local` field.
- 16 native `<select>` controls across 6 files.
- 46 existing shared Radix Select instances across 26 files, including forms, filters, the component showcase, and the new Calendar internals.
- One native `datalist`, one radio-based rating control, several checkbox-based multi-select controls, and one free-text salary-period control with format-specific navigation.

Dashboard and Analytics date ranges are deliberately excluded from migration. Property financial report ranges also retain the existing reporting-specific `DateRangePicker`.

## Component definitions

### Reused

- `Button`: trigger, month navigation, day cells, and Today action.
- `Popover`: accessible focus-managed floating surface with collision handling.
- `Select`: month and year navigation plus existing form selection fields.
- `Label`: visible field label and required indicator.
- Existing semantic colors and focus tokens.

### Created

#### `Calendar`

Source: `src/components/ui/calendar.tsx`

Controlled props:

- `selected?: string`: selected calendar date in `YYYY-MM-DD` format.
- `month: string`: visible month represented by an ISO calendar date.
- `onMonthChange(month: string)`: visible-month callback.
- `onSelect(date: string)`: selected-date callback.
- `min?`, `max?`: inclusive ISO calendar-date limits.
- `disabled?`, `today?`, `showToday?`, `className?`, and `aria-label`.

Behavior:

- Month arrows and month/year Select controls.
- Monday-first six-week grid, including muted adjacent-month dates.
- Arrow, Home, End, Page Up, and Page Down keyboard movement.
- Disabled out-of-range dates and disabled Today action where applicable.
- Selected and current-day treatments use semantic theme tokens.

#### `FormDatePicker`

Source: `src/components/ui/form-date-picker.tsx`

This is a controlled form-field component. It intentionally uses string values at its public boundary:

- `value?: string`
- `onChange(value: string)`
- `label`, optional `id`, `placeholder`, `required`, `disabled`, `error`, and `helperText`
- optional `min`, `max`, `locale`, `timeZone`, and `formatValue`

The component does not convert selected days through local-midnight `Date` objects. `normalizeFormDateValue` extracts and validates the `YYYY-MM-DD` calendar portion, selection returns the same format, and display formatting uses UTC solely to render that calendar date. This prevents the selected day from moving backward or forward during serialization while preserving current API date strings.

Accessibility:

- Visible label linked to the trigger.
- `aria-required`, `aria-invalid`, and described error/helper content.
- Popover dialog semantics inherited from Radix.
- Fully labelled month/year controls, day buttons, and navigation actions.
- Keyboard grid navigation and focus return inherited from Popover.

Theme/responsive behavior:

- Semantic `background`, `card`, `foreground`, `muted`, `border`, `primary`, `destructive`, and `ring` tokens only.
- Trigger uses the shared 36px control height.
- Popover width is bounded to `calc(100vw - 2rem)` with collision padding.

### Adjusted

#### `Select`

Source: `src/components/ui/select.tsx`

The existing Radix Select remains the form single-value primitive. It now adds:

- `aria-invalid` border and focus styling.
- Disabled background consistency with Input.
- Trigger truncation for long selected labels.
- Available-height-aware content instead of a trigger-height viewport.
- Scroll up/down controls for long lists.
- Collision padding and standard popper offset.

Radix continues to provide controlled and uncontrolled values, required/disabled state, disabled options, typeahead, keyboard navigation, focus management, and collision-aware positioning. Labels and messages remain composed with `FormField`/`Label`; no redundant FormSelect wrapper was created.

### DropdownMenu status

There is no `src/components/ui/dropdown-menu.tsx` and no `@radix-ui/react-dropdown-menu` dependency in the current repository. No form uses DropdownMenu as a value input, and no duplicate menu abstraction was introduced. A future contextual-menu requirement should add the Radix DropdownMenu primitive once and keep it separate from form Select. It should expose Trigger, Content, Item, RadioGroup, RadioItem, and disabled items. It must not be used as a replacement for the form selections inventoried below.

### Known limitations

- `FormDatePicker` is intentionally single-date only. It does not handle times, month-only periods, ranges, or free-form recurring periods.
- It is controlled-only so form state remains the source of truth.
- Clearing is not included because the confirmed fields already handle optional empty values through form state; a standardized clear affordance needs product approval.
- `min`/`max` must be valid ISO calendar strings.
- Searchable Combobox is not yet a shared primitive. Large dynamic entity lists are identified separately below.

## A. Form Date Picker inventory

| Form | Route | Field | Current component / value | Validation or dependency | Proposed component | Complexity |
|---|---|---|---|---|---|---|
| Create/Edit Tenant | `/properties/[id]?tab=tenants` | Lease Start Date (`termStart`) | `Input type=date`; string; edit value strips `T...` | Required; submitted unchanged; local draft persisted | `FormDatePicker` | Medium |
| Create/Edit Tenant | `/properties/[id]?tab=tenants` | Rent Start Date (`rentStart`) | `Input type=date`; string; edit value strips `T...` | Required; drives monthly/quarterly/annual payment-period generation later | `FormDatePicker` | High |
| Create/Edit Activation Request | `/properties/[id]?tab=activations` | Start date | `Input type=date`; `YYYY-MM-DD` string | Required; paired with end date; recalculates duration and proposed budget unless manually overridden | `FormDatePicker` | High |
| Create/Edit Activation Request | `/properties/[id]?tab=activations` | End date | `Input type=date`; `YYYY-MM-DD` string | Required; must be on/after start date; same calculations as above | `FormDatePicker` with start-based `min` only if existing validation UX is preserved | High |
| Create/Edit Daily Operations Report | `/properties/[id]?tab=reports` | Report date | RHF `Input type=date`; API string | Required; defaults from `new Date().toISOString()` or existing report; draft/create/update payload unchanged | RHF Controller + `FormDatePicker` | Medium |
| Daily Report — Tenant Issues | `/properties/[id]?tab=reports` | Date reported (repeating rows) | `Input type=date`; string | Optional; defaults to UTC-derived today; row is sent only when tenant and issue are populated | `FormDatePicker` | Medium |
| Create/Edit Other Income | `/myIncome/other` and `/myIncome/other/[id]` | Due date | `Input type=date`; optional string | Defaults to UTC-derived today + 30 days; direct create/update payload; locally retained defaults | `FormDatePicker` | Medium |
| Create/Edit To-Do | `/todos/create`, `/todos/[id]` | Due date | `Input type=date`; optional string | Included only when non-empty; edit value strips `T...` | `FormDatePicker` | Low |
| Create Offer Letter | `/offers/create` and embedded `/offers` dialog | Offer Expiry Date | `Input type=date`; optional string | Stored in local draft and passed unchanged in offer payload | `FormDatePicker` | Low |
| Service Provider Detail — Upload Document | `/properties/[id]/service-provider-detail` | Expiry Date | `Input type=date`; optional string | Attachment metadata; submitted only with upload | `FormDatePicker` | Low |
| Tenant Details — Generate Invoice | `/properties/[tenantId]/tenant-details` | Due Date | `Input type=date`; string | Required by handler; default comes from next payment due date; invoice API receives the same string | `FormDatePicker` | Medium |
| Tenant Payment Reports — Generate Balance Invoice | `/properties/[tenantId]/tenant-details/payment-reports` | Due date | `Input type=date`; string | Required by disabled action; defaults to UTC-derived today + 30 days | `FormDatePicker` | Medium |
| Tenant Bills — Create Bill | `/properties/[tenantId]/tenant-details/bills` | Due Date | `Input type=date`; optional string | Native `min` is UTC-derived today; passed as optional bill payload value | `FormDatePicker` | Medium |
| Tenant Bills — Edit Bill | `/properties/[tenantId]/tenant-details/bills` | Due Date | `Input type=date`; optional string | Existing saved value; no minimum restriction | `FormDatePicker` | Low |
| Tenant Bills — Generate Bill Invoice | `/properties/[tenantId]/tenant-details/bills` | Due Date | `Input type=date`; required string | Required in handler and markup; UTC-derived today minimum; invoice payload unchanged | `FormDatePicker` | Medium |
| Create Managed User | `/roles/create` → Create Managed User | Role Expiration | `Input type=datetime-local`; local date-time string | Optional; sent as `expiresAt` without conversion | Separate date-time picker; **not** `FormDatePicker` | High |
| Tenant Details — Record Payment | `/properties/[tenantId]/tenant-details` | Payment Period (monthly) | `Input type=month`; `YYYY-MM` | Required; conditional on MONTHLY policy; payload is a period identifier, not a day | Specialized PaymentPeriod control | High |

Timezone risk noted during audit: several defaults use `new Date().toISOString().split('T')[0]`. Around local midnight this can disagree with the user’s Nairobi calendar day. Migration should replace only the UI default helper while preserving payload formats, after product confirmation.

## B. Native dropdown and Select inventory

### Native controls requiring migration

| Form | Route | Field | Current component | Selection type | Validation / dependency | Proposed component | Complexity |
|---|---|---|---|---|---|---|---|
| Create/Edit Tenant | `/properties/[id]?tab=tenants` | Unit | Native select with API options and disabled occupied units | B — searchable entity combobox | Required; property-scoped; create shows vacant only; edit keeps current and disables unavailable units | Future searchable Combobox | High |
| Create/Edit Tenant | same | Escalation Frequency | Conditional native select | A — standard Select | Required only when escalation rate > 0; enum payload includes legacy `BI_ENNIAL` spelling | Shared `Select` | Medium |
| Create/Edit Tenant | same | VAT Type | Native select | A | Required; controls VAT-rate visibility and validation | Shared `Select` | Medium |
| Create/Edit Tenant | same | Payment Policy | Native select | A | Required; controls all later payment-period choices/calculations | Shared `Select` | High |
| Create/Edit Tenant | same | Service Charge Type | Conditional native select | A | Present only when service charge exists; changes amount field and validation branch | Shared `Select` | High |
| Create/Edit Tenant | same | Service Charge VAT Type | Conditional native select | A | Controls VAT-rate field and service-charge validation | Shared `Select` | High |
| Create/Edit Service Provider | `/properties/[id]?tab=providers`; edit also `/properties/[id]/service-provider-detail` | Property | Native API-backed select when property is not pre-scoped | B — searchable entity combobox | Required; hidden/pre-populated in property workspace; updates displayed property name | Future searchable Combobox | Medium |
| Create/Edit Service Provider | same | Charge Frequency | Native select | A | Required enum, persisted in drafts and payload | Shared `Select` | Low |
| Create/Edit Activation Request | `/properties/[id]?tab=activations` | VAT type | Native select | A | Required; controls calculation explanation and totals | Shared `Select` | Medium |
| Daily Report — Maintenance | `/properties/[id]?tab=reports` | Repair status (repeating rows) | Native select | A | Per-row enum; preserved in maintenance array | Shared `Select` | Low |
| Daily Report — Security | same | CCTV status | Native select registered directly with RHF | A | Defaults to `OPERATIONAL`; submitted in security payload | RHF Controller + shared `Select` | Medium |
| Daily Report — Tenant Issues | same | Issue status (repeating rows) | Native select | A | Per-row enum; row submission depends on tenant and issue text | Shared `Select` | Low |
| Tenant Details — Record Payment | `/properties/[tenantId]/tenant-details` | Quarterly Year | Native generated select | F — specialized period control | Options derive from `rentStart`; combines with quarter into `YYYY-Qn` | Specialized PaymentPeriod control using shared Select internally | High |
| Tenant Details — Record Payment | same | Quarter | Native generated select plus quick buttons | F | Dependent on selected year and rent start; duplicated generated option values must remain stable | Specialized PaymentPeriod control | High |
| Tenant Details — Record Payment | same | Annual Year | Native generated select plus quick buttons | F | Values derive from rent start and use backend-specific period strings | Specialized PaymentPeriod control | High |
| Mark Tenant as Left dialog | `/properties/[id]?tab=tenants` | Reason for leaving | Native select | A | Optional enum; disabled during mutation | Shared `Select` | Low |

### Already standardized shared Select controls

| Form / surface | Route | Fields | Type and notes |
|---|---|---|---|
| Property form | `/properties/create`, `/properties/[id]` edit mode | Property Form, Usage Type | A; static required enums |
| Property form | same | Existing Landlord | B candidate; API-backed potentially long entity list, currently shared Select |
| Unit form | `/properties/[id]?tab=units` | Property, Unit Type, Status, Rent Type | Property is a B candidate outside a pre-scoped workspace; others A |
| Offer Letter | `/offers/create`, `/offers` dialog | Lead, Property, Unit, Letter Type, Escalation Frequency | Lead/property/unit are B candidates with dependent API options; letter/frequency are A |
| Lead form | `/leads/create`, `/leads/[id]` | Property | B candidate; optional API-backed entity list |
| Employee form | `/employees/create`, `/employees/[id]/edit` | Employment Status, Payment Frequency | A |
| Record Salary Payment dialog | `/employees/[id]` | Payment Method | A |
| To-Do form | `/todos/create`, `/todos/[id]` | Priority, Assign To | Priority A; assignee B candidate and create-only/permission-dependent |
| Other Income form | `/myIncome/other`, `/myIncome/other/[id]` | Category, VAT Type | A; option arrays from API helpers, VAT drives rate disabled state |
| Tenant Bills dialogs | `/properties/[tenantId]/tenant-details/bills` | Bill Type in create/edit | A; affects previous-reading lookup in create flow |
| Service Provider attachment upload | `/properties/[id]/service-provider-detail` | Category | A; dynamic known categories with explicit empty sentinel |
| Create Managed User | `/roles/create` | Custom Role | A or B candidate if role count grows; required and error-styled |
| Managed User Role & Permissions | `/users/[id]` | Assigned Custom Role | A; changing value is staged until Save |
| Managed User Property Access | `/users/[id]` | Eligible Property | B candidate; API-scoped eligible list |
| Admin user management legacy surface | component usage dependent | User Role | A; mutation occurs on change, so migration must preserve confirmation/permission behavior |
| News rich-text toolbar | `/news/create`, `/news/[id]` | Heading level | C/F toolbar command implemented with Select; retain keyboard behavior |
| To-Do statistics dialog | `/todos` | User | B candidate; dynamic manager/admin scope |
| List filters | `/todos`, `/offers`, `/myIncome/other`, `/users` | Status, priority, category, user, role | A; filters, not persisted form payloads |
| Property financial reports | `/properties/[id]/details?tab=payments` | Rent status, bill type, invoice status | A; already standardized; date ranges remain excluded reporting controls |
| Dashboard and Analytics | `/dashboard`, `/analytics/**` | Property | Already shared Select; date-range controls explicitly excluded |

### Specialized controls requiring separate treatment

| Control | Route | Classification | Recommendation |
|---|---|---|---|
| Activation Type datalist | `/properties/[id]?tab=activations` | B — editable Combobox | Preserve free typing plus suggestions; do not replace with closed Select unless backend enum enforcement is approved. |
| Salary Payment Period text field and previous/current/next actions | `/employees/[id]` | F — frequency-specific period control | Keep specialized validation for monthly, daily, weekly, and bi-weekly formats; consider a dedicated SalaryPeriodPicker. |
| Tenant monthly/quarterly/annual payment period | `/properties/[tenantId]/tenant-details` | F | One policy-aware PaymentPeriod control should preserve rent-start calculations and exact payload strings. |
| Daily cleanliness rating | `/properties/[id]?tab=reports` | D — RadioGroup | Keep radio semantics; later standardize visuals with a shared RadioGroup primitive if added. |
| Role/property permission checkboxes | `/roles/create`, `/roles/[id]`, `/users/[id]` | E — multiple selection | Keep checkboxes; not Select/DropdownMenu candidates. |
| Dashboard, Analytics, rent-report and bills-report ranges | reporting routes | F — date range | Retain existing `DateRangePicker`; outside this migration. |

No form-value use of DropdownMenu was found. Contextual action buttons should use a future DropdownMenu primitive, while all value-bearing fields above retain Select/Combobox/Radio/Multiple-selection semantics.

## D. Forms requiring migration

### 1. Native date inputs

- Tenant: lease start and rent start.
- Activation: start and end.
- Daily Operations Report: report date and repeating tenant-issue date.
- Other Income: due date.
- To-Do: due date.
- Offer Letter: expiry date.
- Service Provider attachment: expiry date.
- Tenant invoices: normal invoice due date and balance-invoice due date.
- Tenant bills: create/edit bill due date and generated bill-invoice due date.

### 2. Custom or specialized date/period inputs

- Managed User role expiration (`datetime-local`).
- Tenant monthly payment period (`month`).
- Tenant quarterly/annual generated period controls.
- Employee salary payment period free-text control.
- Reporting date ranges, explicitly retained and excluded.

### 3. Native selects

- Tenant form (six controls).
- Service Provider form (two controls).
- Activation VAT type.
- Daily Report statuses (three controls).
- Tenant payment-period selectors (three specialized controls).
- Mark Tenant Left reason.

### 4. Custom legacy dropdowns

- No ARIA listbox or menu-style form dropdown was found.
- Activation Type uses native datalist/autocomplete behavior and requires Combobox semantics.
- Tenant payment quick buttons are part of a specialized period control, not a dropdown replacement target.

### 5. Already standardized inputs

- Shared Radix Select is already used across Property, Unit, Offer, Lead, Employee, To-Do, Other Income, tenant bills, user/role administration, and list/report filters.
- These instances inherit the Select primitive improvements without production-form source changes.

### 6. Separate-treatment controls

- Searchable entity selectors.
- Datetime and month/period selection.
- Radio ratings.
- Checkbox multi-selection.
- Rich-text toolbar commands.

## E. Recommended migration order

1. **Create/Edit Tenant** — migrate the two dates and five simple native enums together; design the unit Combobox and policy-aware period risks separately. This is the confirmed visual example.
2. **Activation Request** — migrate paired dates and VAT Select together; regression-test end-date validation and duration/budget calculations.
3. **Daily Operations Report** — integrate FormDatePicker/Select through RHF Controller without changing `shouldUnregister: false`, array rows, or payload construction.
4. **Tenant invoice and bill dialogs** — migrate all due-date fields as one billing group, preserving required/min/default behavior and invoice payloads.
5. **Other Income, To-Do, Offer Letter, and provider attachment** — low-coupling single-date conversions.
6. **Service Provider and Mark Tenant Left** — straightforward native Select conversions; defer property search if Combobox is not approved.
7. **Searchable entity selectors** — introduce one shared Combobox only after search/empty/loading semantics are approved; then migrate tenant unit, landlord, lead/property/unit, assignee, and eligible-property fields together by page.
8. **Specialized period/date-time controls** — managed-user expiration, tenant payment periods, and salary payment periods require separate designs and tests.

## F. Regression risks

- **Calendar serialization:** converting through local or UTC midnight can shift dates. Keep `YYYY-MM-DD` strings at the form boundary.
- **UTC-derived defaults:** existing `toISOString()` defaults can differ from the Nairobi day; changing them is behavior-sensitive and should be explicit.
- **Native browser validation:** replacing native inputs removes native `min`, `required`, and invalid-focus behavior unless mapped to component props and form validation.
- **Activation calculations:** start/end selection drives inclusive-day budget calculations and manual override reset behavior.
- **Tenant rent start:** payment-period options and financial calculations depend on this date.
- **RHF integration:** Daily Report fields require Controller or explicit `setValue`/`watch`; direct `register` props cannot be passed to a button-trigger date picker or Radix Select.
- **Conditional fields:** tenant VAT/service-charge/escalation controls appear and validate conditionally.
- **Disabled entity options:** tenant unit availability rules must remain identical, including current occupied unit handling during edit.
- **Empty sentinels:** several Radix Selects use values such as `self`, `all`, `__none`, and `__select_property__`; migration must preserve the conversion to empty/undefined payloads.
- **Dynamic option scope:** properties, units, leads, landlords, users, and roles are permission- and property-scoped.
- **On-change mutations:** offer status and legacy admin role Selects can mutate immediately; they are not ordinary staged form fields.
- **Period formats:** monthly, quarterly, annual, weekly, and bi-weekly values are backend identifiers, not interchangeable dates.
- **Search behavior:** replacing large native/API Selects with a non-searchable control could reduce usability; replacing them with a Combobox can change keyboard and empty-state behavior.

## Exact production source files for future migration

Date and native-selection targets:

- `src/components/forms/TenantForm.tsx`
- `src/components/forms/ActivationForm.tsx`
- `src/components/forms/activation/ActivationFormSections.tsx`
- `src/components/forms/DailyReportForm.tsx`
- `src/components/forms/daily-report/DailyReportSections.tsx`
- `src/components/forms/IncomeFormModal.tsx`
- `src/components/forms/TodoForm.tsx`
- `src/components/offers/form/OfferFormSections.tsx`
- `src/components/forms/ServiceProviderForm.tsx`
- `src/components/tenant/TenantFinancialPage.tsx`
- `src/components/administration/create/CreateManagedUserForm.tsx`
- `src/components/properties/workspace/dialogs/MarkTenantLeftDialog.tsx`
- `src/app/(dashboard)/properties/[id]/service-provider-detail/page.tsx`
- `src/app/(dashboard)/properties/[id]/tenant-details/page.tsx`
- `src/app/(dashboard)/properties/[id]/tenant-details/bills/page.tsx`

Potential future Combobox consumers:

- `src/components/forms/PropertyForm.tsx`
- `src/components/forms/UnitForm.tsx`
- `src/components/forms/LeadForm.tsx`
- `src/components/offers/form/OfferFormSections.tsx`
- `src/components/forms/TodoForm.tsx`
- `src/components/administration/users/UserPropertyAccess.tsx`
- `src/components/administration/create/CreateManagedUserForm.tsx`

## Outstanding design and behavior questions

1. Should optional dates expose an explicit Clear action, and should clearing require confirmation in any billing flow?
2. Should “Today” use the authenticated property timezone, the account timezone, or the browser timezone? The current reporting picker is explicitly Nairobi-based.
3. Should dates outside the currently valid business range be disabled proactively, or should current submit-time validation remain the only enforcement?
4. Is a searchable Combobox approved for entity lists, and what option count should trigger search?
5. Should managed-user expiration remain a local wall-clock string or be converted to an offset-bearing timestamp? This cannot be changed safely as a visual-only migration.
6. Should the tenant payment-period and employee salary-period controls share one period abstraction or remain domain-specific?
7. Should a Radix DropdownMenu dependency be introduced now for contextual actions, or deferred until a concrete menu migration is scoped?
