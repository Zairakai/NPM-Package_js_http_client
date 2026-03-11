# Contributing

> This project follows the [Zairakai Global Contributing Guide][handbook-contributing].  
> Please read it before contributing. The sections below document project-specific workflow.

---

## Development Workflow

| Step | Command / Action | Description |
| :--- | :--- | :--- |
| **1. Install** | `npm install` | Install dependencies and set up git hooks. |
| **2. Branch** | `git checkout -b feature/#TICKET-name` | Create a feature branch from `main`. |
| **3. Code** | *(your IDE)* | Implement your changes following quality standards. |
| **4. Quality** | `make quality` | Run the full quality gate. |
| **5. Test** | `make test` | Ensure all tests are passing. |
| **6. Commit** | `git commit -m "type(scope): #TICKET subject"` | Use [Conventional Commits][git-rules] format. |
| **7. Push** | `git push origin feature/#TICKET-name` | Push and open a Merge Request to `main`. |

---

## Types of Contributions

| Type | Guidelines |
| :--- | :--- |
| **🐛 Bug Reports** | Use the issue template. Include minimal reproduction steps, expected vs actual behavior, Node.js/Axios versions. |
| **✨ Feature Requests** | Describe the use case. Must fit the scope (HTTP client, interceptors, request tracking, Laravel CSRF). |
| **🔌 Factory Functions** | Add to `src/client.ts`. Follow `createXxxClient` naming. Support standard Axios options. Add mock-based tests. |
| **🔗 Interceptors** | Add to `src/interceptors.ts`. Keep functional pattern. Support config options where appropriate. |
| **📊 Request Tracking** | In `src/request-tracker.ts`. Prevent memory leaks. Cover full lifecycle in tests. |
| **📦 Types** | Keep exports in `src/index.ts` stable and backward compatible. |

---

## Quality Targets

| Command | Tool | Description |
| :--- | :--- | :--- |
| `make quality` | All | Full quality gate (lint, format, typecheck, tests). |
| `make eslint` | ESLint | JavaScript/TypeScript linting. |
| `make prettier` | Prettier | Code formatting check. |
| `npm run typecheck` | TypeScript | Type checking without emit. |
| `make test` | Vitest | Run unit tests with coverage. |
| `make markdownlint` | Markdownlint | Validate Markdown documentation. |

---

[handbook-contributing]: https://gitlab.com/zairakai/handbook/-/blob/main/CONTRIBUTING.md
[git-rules]: https://gitlab.com/zairakai/handbook/-/blob/main/policies/git-rules.md
