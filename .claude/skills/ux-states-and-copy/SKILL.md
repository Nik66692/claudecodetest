---
name: ux-states-and-copy
description: >-
  Use when building or changing any user-facing feature to ensure every
  relevant state is designed (loading, empty, success, partial-success,
  validation, error, disabled, offline, permission-denied) and that interface
  copy is concise, specific, actionable, and non-blaming. Enforces specific
  action labels and clear destructive-action consequences.
---

# UX States and Copy

## Purpose
Make features complete and trustworthy by designing every meaningful state and
writing copy that helps users act and recover.

> Use the product's existing terminology and tone. The examples below are
> illustrative; adapt labels to this product's domain.

## When to activate
- Building or changing any feature with user input, async work, or outcomes.
- Reviewing flows that can succeed, partially succeed, fail, or be empty.

## Workflow
1. Enumerate the states the feature can be in.
2. Design each relevant state's content and affordances.
3. Write copy for labels, messages, confirmations, and recovery actions.
4. Verify states render correctly (coordinate with `visual-qa-and-polish`).
5. Report which states were implemented and verified.

## Review criteria — states to consider
Initial; loading; empty; success; partial-success; validation; error; disabled;
offline / connection-error (where relevant); permission-denied;
destructive-action confirmation; cancellation; retry and recovery actions.

## Review criteria — copy to enforce
- Concise interface copy and specific action labels.
- Consistent product terminology.
- Useful error messages that name the cause and the recovery path.
- Actionable empty states that suggest a useful next action.
- Clear confirmation messages.
- No unnecessary technical jargon.
- No blame-oriented language.
- No vague messages when the cause is actually known.

## Preferred examples
- Prefer `Import deck` over `Submit`.
- Prefer `Save changes` over `OK`.
- Explain which data failed to import, not just "import failed".
- Explain how the user can recover.
- Make empty states suggest a useful next action.
- Mention partial success when only part of an operation completed.

## Destructive actions
Confirmations must clearly communicate the consequence (what is removed, whether
it is reversible) and use a specific action label, not a generic one.

## Completion criteria
- All relevant states are implemented (not just the happy path).
- Copy is specific, consistent, actionable, and non-blaming.

## Reporting requirements
Report: states implemented vs. intentionally omitted (with reason); copy
decisions for key labels/messages; and any state left unverified.
