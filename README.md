# Backend Web Development — Assignments

Welcome! This repository holds the **starter code** for the hands-on assignments in the
**Backend Web Development** course. It is shared with **both students and mentors**.

You will build real backend skills the way working engineers do: by writing code,
pushing it to a branch, and opening a **Pull Request (PR)** for review.

---

## What this course is about

Backend Web Development takes you from the fundamentals of the server side through to
building structured, production-shaped Node.js and Express applications. Across the
course you will work with the Node runtime, the file system and streams, HTTP and
routing, modular Express apps, middleware pipelines, request validation, and more.

Many lessons are anchored around **Threadbase**, a reference developer-community app, so
the concepts you learn always connect to how a real backend is actually built.

---

## What is in this repo

This repository contains the **starter code for one assignment**, at the root. Everything
you need to begin is right here:

```
README.md        ← the full brief: what to do, how to run, how to submit
package.json     ← dependencies and the "npm start" script
...starter files with TODOs for you to complete
```

> Read `README.md` for the complete details, and only edit the files it tells you to.

---

## How PR-based assignments work

These assignments are **Project Artifact Submissions**: you work in **your own**
repository and submit a link to a Pull Request, and your **code** is reviewed against a
rubric (an automated AI reviewer plus, where needed, a mentor).

> **You do not push to this starter repo.** This repo is read-only reference material.
> You copy the starter code into your own repository, do all your work there, and open the
> PR inside *your* repo.

The flow is the same every time:

1. **Create your own repository** for the assignment (follow your cohort's instructions),
   and copy this starter code into it. This starter repo stays untouched.
2. **In your repo, create a branch** for your work, e.g. `git checkout -b lu16-streams`
   (committing straight to `main` is fine too if that is what your cohort uses).
3. **Install dependencies** inside the assignment folder: `npm install`.
4. **Run it** to make sure it starts: `npm start`.
5. **Implement the TODOs** described in the `README.md`.
6. **Test locally** until the behaviour matches the brief's examples.
7. **Commit and push** to your own repo:
   ```bash
   git add .
   git commit -m "lu16: implement streams assignment"
   git push origin lu16-streams
   ```
8. **Open a Pull Request in your own repository** (e.g. your branch into your `main`) and
   **submit the PR link** on the platform.

### What gets graded

Only the **code in your PR** is evaluated against the assignment rubric — does the code
do what the brief asks, correctly and cleanly. A clear PR title and description are good
practice, but the **description itself is not part of the grade**.

### Submission checklist

- [ ] Working in **your own repo** (not this starter repo).
- [ ] All TODOs implemented; no leftover `// TODO` placeholders.
- [ ] `npm install` and `npm start` run without errors.
- [ ] Behaviour matches the examples in the brief.
- [ ] Only the files you were asked to change have changed.
- [ ] Pushed to your repo and PR opened there; PR link submitted.

---

## Tips

- **Do not commit `node_modules/`.** Run `npm install` locally instead.
- Keep commits small and meaningful.
- If something is unclear, re-read the `README.md` before asking — the examples usually
  answer it.

Happy building.
