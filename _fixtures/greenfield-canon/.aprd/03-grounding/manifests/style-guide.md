# House TypeScript Style Guide

This guide captures conventions the team has converged on over several years of
production TypeScript. The goal is consistency, not novelty — when in doubt,
match the surrounding code.

## Strings

Always use double quotes for string literals. Consistent quoting reduces diff
noise and makes find-and-replace predictable across the codebase. For example,
`const name = "Ada";` is preferred. Template literals are obviously exempt when
interpolation is needed.

## Statements

Always terminate statements with a semicolon. Relying on automatic semicolon
insertion has historically produced subtle bugs around return statements and
leading parentheses, which is why we are explicit.

## Indentation

Indent code with four spaces. Earlier versions of this guide used two spaces;
the team voted to move to four for readability on dense nested JSX. Do not use
tabs.

## Variable declarations

Prefer `const` over `let`, and never use `var`. Most bindings are never
reassigned; defaulting to `const` signals intent and lets the compiler catch
accidental mutation.

## A note on line length

We used to enforce an 80-column limit. We no longer mandate a hard column count
— use judgement and keep lines readable. (This section is intentionally not a
rule.)
