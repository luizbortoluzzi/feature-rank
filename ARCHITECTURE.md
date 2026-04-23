# Architecture Diagrams

> Generated on 2026-04-13. Based on actual repository structure and implementation.
> The technology stack was intentionally selected to align with the requirements and expectations of the target role.

---

# Monorepo Architecture

```mermaid
graph TD
    subgraph MONOREPO["feature-rank (monorepo)"]
        direction TB

        subgraph FRONTEND["frontend/ — React + TypeScript + Vite"]
            FE_SRC["src/"]
            FE_DOCKER["Dockerfile"]
            FE_CFG["vite.config.ts / tsconfig.json / package.json"]
        end

        subgraph BACKEND["backend/ — Django + DRF + Python 3.13"]
            BE_CFG["config/ (settings, urls, wsgi, asgi)"]
            BE_APPS["apps/ (users, categories, statuses, feature_requests, roles)"]
            BE_DOCKER["Dockerfile"]
            BE_PY["pyproject.toml / conftest.py"]
        end

        subgraph DOCS["docs/ — Architecture Source of Truth"]
            DOCS_ARCH["architecture/"]
            DOCS_DOMAIN["domain/"]
            DOCS_ENG["engineering/"]
            DOCS_ADR["decisions/ (ADR-001 to ADR-010)"]
            DOCS_DEPLOY["deployment/"]
        end

        subgraph INFRA["Infrastructure / Tooling"]
            DC_DEV["docker-compose.yml (dev)"]
            DC_PROD["docker-compose.prod.yml (prod)"]
            MAKE["Makefile (developer workflow)"]
            PRECOMMIT[".pre-commit-config.yaml"]
            GH_CI[".github/workflows/ci.yml"]
            SCRIPTS["scripts/ (deploy, seed, reset)"]
            DEPLOY_DIR["deploy/ (systemd service)"]
        end

        subgraph CLAUDE[".claude/ — Claude Code Config"]
            CLAUDE_CFG["settings.local.json"]
        end
    end

    FRONTEND -- "HTTP (Axios / JWT)" --> BACKEND
    DOCS -. "governs design of" .-> FRONTEND
    DOCS -. "governs design of" .-> BACKEND
    DC_DEV -- "orchestrates" --> FRONTEND
    DC_DEV -- "orchestrates" --> BACKEND
    DC_DEV -- "orchestrates" --> DB[(MySQL 8.4)]
    DC_PROD -- "orchestrates" --> NGINX[Nginx]
    DC_PROD -- "orchestrates" --> TRAEFIK[Traefik / TLS]
    GH_CI -- "lint + test + build" --> FRONTEND
    GH_CI -- "lint + test + build" --> BACKEND
```

---

# Frontend Architecture

```mermaid
graph TD
    subgraph ENTRY["Entry Point"]
        MAIN["main.tsx\n(MantineProvider, QueryClientProvider, Notifications)"]
        APP["App.tsx"]
        ROUTER["app/router.tsx\n(React Router v6)"]
    end

    subgraph LAYOUT["App Shell"]
        APP_LAYOUT["AppLayout.tsx\n(header / nav / footer)"]
        AUTH_PROVIDER["AuthProvider.tsx\n(Auth context)"]
        PROTECTED["ProtectedRoute.tsx\n(auth guard)"]
    end

    subgraph PAGES["Pages"]
        P_LOGIN["login-page/"]
        P_FEATURES["feature-list-page/"]
        P_DETAIL["feature-detail-page/"]
        P_EDIT["edit-feature-page/"]
        P_CATEGORIES["categories-page/"]
        P_STATUSES["statuses-page/"]
        P_USERS["users-page/"]
    end

    subgraph FEATURES["Feature Modules (src/features/)"]
        F_AUTH["auth/\nhooks · queryKeys"]
        F_FEAT["feature-requests/\nhooks · components"]
        F_CAT["categories/\nhooks · components"]
        F_STAT["statuses/\nhooks · components"]
        F_VOTE["voting/\nhooks"]
    end

    subgraph SHARED_UI["Shared Components (src/components/)"]
        FORM_FIELDS["form/ (TextInput, Textarea,\nSelect, Switch, NumberInput...)"]
        DATA_TABLE["data-table/"]
        CONFIRM["confirm-modal/"]
        PAGINATION["pagination/"]
        VOTE_BTN["vote-button/"]
        BADGES["badge / colored-badge / empty-state"]
        MISC["spinner / page-header / error-message"]
    end

    subgraph STATE["State Management"]
        TQ["TanStack Query v5\n(server state, caching, mutations)"]
        LOCAL["React hooks\n(local/UI state)"]
    end

    subgraph API_LAYER["API Layer (src/services/)"]
        AXIOS["api.ts\n(Axios instance, JWT interceptors,\ntoken refresh queue, 401 retry)"]
        SVC_AUTH["auth.ts"]
        SVC_FEAT["features.ts"]
        SVC_CAT["categories.ts"]
        SVC_STAT["statuses.ts"]
        SVC_VOTE["voting.ts"]
        TOKEN_MGR["auth-token.ts\n(localStorage access token)"]
    end

    subgraph TYPES["Types (src/types/)"]
        T["api · feature · vote\ncategory · status · user"]
    end

    MAIN --> APP --> ROUTER
    ROUTER --> APP_LAYOUT
    ROUTER --> AUTH_PROVIDER
    ROUTER --> PROTECTED
    ROUTER --> PAGES

    PAGES --> FEATURES
    FEATURES --> SHARED_UI
    FEATURES --> STATE

    STATE --> TQ
    TQ --> API_LAYER
    API_LAYER --> AXIOS
    AXIOS -- "HTTP/REST" --> BACKEND_API[("Backend API\n/api/v1/...")]
    TOKEN_MGR --> AXIOS
    API_LAYER --> TYPES
```

---

# Backend Architecture

```mermaid
graph TD
    subgraph HTTP_IN["HTTP Request"]
        CLIENT["Frontend / Client"]
    end

    subgraph ENTRY["Entry Points"]
        WSGI["wsgi.py / asgi.py"]
        ROOT_URL["config/urls.py\n(root router)"]
    end

    subgraph MIDDLEWARE["Middleware Stack"]
        CORS_MW["CorsMiddleware"]
        JWT_MW["JWTAuthentication (SimpleJWT)"]
        DRF_MW["DRF Middleware"]
    end

    subgraph VIEWS["Views Layer (HTTP I/O)"]
        V_AUTH["config/auth_views.py\nLoginView · TokenRefreshView · LogoutView\n(HttpOnly refresh cookie)"]
        V_USERS["apps/users/views.py\nRegisterView · MeView"]
        V_FEAT["apps/feature_requests/views.py\nFeatureRequestViewSet\n(list, create, retrieve, update, destroy, vote, unvote)"]
        V_CAT["apps/categories/views.py\nCategoryViewSet"]
        V_STAT["apps/statuses/views.py\nStatusViewSet"]
        V_HEALTH["config/views.py\nHealthCheckView"]
    end

    subgraph SERIALIZERS["Serializers Layer (Validation + Transformation)"]
        S_FEAT_R["FeatureRequestListSerializer\n(read, vote_count, has_voted)"]
        S_FEAT_W["FeatureRequestWriteSerializer\n(write, field protection)"]
        S_USER["UserRegistrationSerializer\nUserMeSerializer"]
        S_CAT["CategorySerializer / NestedCategorySerializer"]
        S_STAT["StatusSerializer / NestedStatusSerializer"]
    end

    subgraph PERMISSIONS["Permissions"]
        P_ADMIN["IsAdminUser"]
        P_AUTHOR["IsAuthorOrAdmin"]
        P_AUTH["IsAuthenticated"]
        P_ANY["AllowAny"]
    end

    subgraph SERVICES["Services Layer (Business Logic)"]
        SV_FEAT["feature_requests/services.py\ncreate · update · delete · vote · unvote\nstatus transition validation"]
        SV_USER["users/services.py\ncreate_user · update_user"]
        SV_CAT["categories/services.py\ncreate · update · delete"]
        SV_STAT["statuses/services.py\ncreate · update · delete"]
    end

    subgraph SELECTORS["Selectors Layer (Query Logic)"]
        SEL_FEAT["feature_requests/selectors.py\nget_feature_requests_list()\n• select_related (no N+1)\n• annotate vote_count (Count)\n• annotate has_voted (Exists)\n• filter by category/status/author/search\n• order: vote_count DESC → created_at DESC → id DESC"]
        SEL_USER["users/selectors.py\nget_user_by_email · get_user_list"]
        SEL_CAT["categories/selectors.py\nget_categories_list"]
        SEL_STAT["statuses/selectors.py\nget_statuses_list"]
    end

    subgraph MODELS["Models Layer (ORM + DB Constraints)"]
        M_USER["User\n(AbstractUser + name, email,\nis_admin, avatar_url)"]
        M_FEAT["FeatureRequest\n(title, description, rate 1-5,\nauthor FK, category FK, status FK,\ncreated_at, updated_at)"]
        M_VOTE["Vote\n(user FK, feature_request FK,\ncreated_at)\nunique_together: (user, feature_request)"]
        M_CAT["Category\n(name unique, icon, color,\ndescription, is_active)"]
        M_STAT["Status\n(name unique, color, is_terminal,\nis_active, sort_order unique)"]
    end

    subgraph INFRA_LAYER["Infrastructure"]
        DB[("MySQL 8.4\n(prod)\nSQLite (test/dev)")]
        RENDERER["drf_renderer.py\n(envelope response format)"]
        EXC_HANDLER["drf_exception_handler.py\n(standardized errors)"]
        PAGINATION["pagination.py\n(20 items/page)"]
    end

    CLIENT --> WSGI --> ROOT_URL
    ROOT_URL --> MIDDLEWARE
    MIDDLEWARE --> VIEWS
    VIEWS --> PERMISSIONS
    VIEWS --> SERIALIZERS
    SERIALIZERS --> SERVICES
    SERVICES --> SELECTORS
    SELECTORS --> MODELS
    MODELS --> DB
    VIEWS --> RENDERER --> CLIENT
    VIEWS --> EXC_HANDLER
    VIEWS --> PAGINATION
```

---

# .claude Folder Architecture

```mermaid
graph TD
    subgraph CLAUDE_ROOT[".claude/"]
        CFG["settings.local.json\n(Claude Code local config)"]
    end

    subgraph CFG_DETAIL["settings.local.json — Contents"]
        PERMS["permissions.allow[]\n(Bash command allowlist)"]
        PERM1["python -c ast.parse ..."]
        PERM2["npm run / pip install"]
        PERM3["python manage.py ..."]
        PERM4["ruff / black / eslint / prettier"]
        PERM5["pytest / vitest"]
        PERM6["git add / commit / log / diff"]
    end

    subgraph CLAUDE_MD["CLAUDE.md (project root — governs all sessions)"]
        RULES["Development Rules\n& Constraints"]
        PROMPT_LOG["PROMPT_HISTORY.md\n(append-only prompt log)"]
        ARCH_GUIDE["Architecture Guidelines\n(layer responsibilities)"]
        WORKFLOW["Preferred Workflow\n(before / during / after coding)"]
    end

    subgraph EXTERNAL_SKILLS["Claude Code Built-in Skills"]
        SK_COMMIT["commit"]
        SK_SIMPLIFY["simplify"]
        SK_LOOP["loop"]
        SK_SCHEDULE["schedule"]
        SK_CLAUDE_API["claude-api"]
        SK_UPDATE_CFG["update-config"]
        SK_KEYBIND["keybindings-help"]
    end

    subgraph AGENTS["Claude Agent SDK (invoked at runtime)"]
        A_GENERAL["general-purpose\n(research, multi-step tasks)"]
        A_EXPLORE["Explore\n(codebase search)"]
        A_PLAN["Plan\n(architecture planning)"]
        A_GUIDE["claude-code-guide\n(API / SDK questions)"]
    end

    CFG --> CFG_DETAIL
    PERMS --> PERM1
    PERMS --> PERM2
    PERMS --> PERM3
    PERMS --> PERM4
    PERMS --> PERM5
    PERMS --> PERM6

    CLAUDE_MD --> RULES
    CLAUDE_MD --> PROMPT_LOG
    CLAUDE_MD --> ARCH_GUIDE
    CLAUDE_MD --> WORKFLOW

    CFG -. "scopes allowed tools for" .-> EXTERNAL_SKILLS
    CLAUDE_MD -. "instructions loaded into every session" .-> AGENTS
    AGENTS -. "can invoke" .-> EXTERNAL_SKILLS
    AGENTS -. "operate within" .-> CLAUDE_MD
```

---

## Notes

### Stack Alignment with Target Role

The technology choices in this project were deliberate and matched to the role's requirements:

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Modern SPA stack expected by the role |
| UI Library | Mantine | Component-complete, accessible, production-grade |
| Server State | TanStack Query v5 | Industry-standard async state management |
| Forms | React Hook Form | Performant, minimal-re-render form handling |
| Backend | Django + DRF | Python backend standard for the role |
| Auth | SimpleJWT with HttpOnly cookies | Secure token rotation pattern |
| Database | MySQL 8.4 | Production SQL database aligned with role expectations |
| Infra | Docker Compose + Nginx + Traefik | Containerized, TLS-ready production deployment |
| CI/CD | GitHub Actions | Standard pipeline tooling |
| AI Tooling | Claude Code + Agent SDK | Demonstrates AI-augmented development workflow |

### Architecture Decisions (ADRs)

Ten Architecture Decision Records (`docs/decisions/`) document every major structural choice:

- **ADR-001** — Monorepo structure
- **ADR-002** — Vote as a standalone entity with uniqueness constraint
- **ADR-004** — Layered backend: Views → Serializers → Services → Selectors → Models
- **ADR-005** — Frontend as a pure API consumer (no embedded business logic)
- **ADR-006** — JWT with 15-minute access tokens + 7-day rotating refresh via HttpOnly cookie
- **ADR-008** — Reference data (categories, statuses, roles) seeded and controlled, not freely created
- **ADR-010** — Makefile as single developer workflow interface
