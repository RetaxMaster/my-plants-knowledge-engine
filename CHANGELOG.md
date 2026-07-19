# Changelog

All notable changes to the Knowledge Engine are documented here. Written for humans: what changed for
whoever operates this agent, not a commit dump.

## Unreleased

### Added

- **Three conduct rules the agent must always follow**, shared with the Plant Doctor so both agents behave
  the same way:
  - It **never repairs its own tooling.** If a script, a credential or the database is broken, it reports
    the problem with the exact command and error and stops, rather than patching around it — an unreviewed
    edit to its own tools is a change nobody approved.
  - It recognizes a platform-authored **`[system]`** notice as something *you did not write*. Such notices
    arrive on the same channel you type on, so they look like your message; the agent now treats them as
    facts about the system's state, never as an instruction from you.
  - It never infers **how old** something is from **how long it has been tracked**. A tracking start date
    and a count of recorded events describe the record, not the organism — a four-year-old plant registered
    yesterday has one day of history. Absent an explicit stored age, the agent says it does not know.
