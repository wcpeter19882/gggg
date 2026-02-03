# Tasks: CLIv2 with OpenHands SDK Integration

**Feature Branch**: `004-cliv2-openhands`  
**Input**: Design documents from `/specs/004-cliv2-openhands/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**MVP Goal**: Runnable CLI that generates slides end-to-end (no mockup code, no placeholder implementations)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and package structure

- [ ] T001 Create `cliv2/` package directory structure with all subdirectories in cliv2/__init__.py, cliv2/__main__.py
- [ ] T002 [P] Create `cliv2/core/__init__.py` with core module exports
- [ ] T003 [P] Create `cliv2/config/__init__.py` with config module exports
- [ ] T004 [P] Create `cliv2/tools/__init__.py` with tools module exports
- [ ] T005 [P] Create `cliv2/skills/__init__.py` with skills module exports
- [ ] T006 [P] Create `cliv2/interfaces/__init__.py` and `cliv2/interfaces/cli/__init__.py`
- [ ] T007 Add cliv2 dependencies to pyproject.toml: openhands-sdk, click, python-dotenv, azure-identity

---

## Phase 2: Foundational (Core Models & Config)

**Purpose**: Core infrastructure that MUST be complete before pipeline orchestration

**⚠️ CRITICAL**: No orchestration work can begin until this phase is complete

- [ ] T008 Implement `cliv2/core/errors.py` with Cliv2Error, ConfigError, GenerationError, StageError hierarchy
- [ ] T009 [P] Implement `cliv2/core/models.py` with GenerationRequest, StageResult, GenerationResult Pydantic models
- [ ] T010 Implement `cliv2/config/env.py` with load_dotenv() and environment variable validation
- [ ] T011 Implement `cliv2/config/llm.py` with create_llm() for Azure OpenAI via LiteLLM format
- [ ] T012 [P] Implement `cliv2/tools/mcp_config.py` with get_mcp_config() to discover .claude/tools/mcp_*.py
- [ ] T013 [P] Implement `cliv2/skills/loader.py` with load_skills() using OpenHands load_skills_from_dir()

**Checkpoint**: Core models, config loading, and skill/tool discovery ready

---

## Phase 3: User Story 1 - Generate Slides via CLI Command (Priority: P1) 🎯 MVP

**Goal**: End-to-end slide generation from markdown source via CLI command

**Independent Test**: Run `cliv2 generate path/to/source.md` and verify complete presentation is generated

### Core Pipeline Implementation (US1)

- [ ] T014 [US1] Implement `cliv2/core/agent.py` with create_agent() factory using OpenHands Agent, LLM, skills, MCP config
- [ ] T015 [US1] Implement `cliv2/core/pipeline.py` with STAGES list and execute_stage() async function
- [ ] T016 [US1] Implement `cliv2/core/orchestrator.py` with async generate() main entry point
- [ ] T017 [US1] Add generate_sync() synchronous wrapper to cliv2/core/orchestrator.py

### CLI Interface Implementation (US1)

- [ ] T018 [US1] Implement `cliv2/interfaces/cli/formatters.py` with format_progress() and format_summary()
- [ ] T019 [US1] Implement `cliv2/interfaces/cli/main.py` with Click @click.group() and generate command
- [ ] T020 [US1] Add `cliv2` entry point to pyproject.toml under [project.scripts]
- [ ] T021 [US1] Update `cliv2/__init__.py` with public API exports (generate, GenerationRequest, GenerationResult)

### Integration & Validation (US1)

- [ ] T022 [US1] Install package in development mode: pip install -e ".[cliv2]"
- [ ] T023 [US1] Manual test: `cliv2 --version` and `cliv2 --help` work correctly
- [ ] T024 [US1] Manual test: `cliv2 generate examples/pitch.md` runs full pipeline

**Checkpoint**: MVP complete - CLI generates slides end-to-end

---

## Phase 4: User Story 2 - Skip or Select Pipeline Stages (Priority: P2)

**Goal**: Add `--skip-research`, `--theme`, `--stop-after` options for pipeline control

**Independent Test**: Run `cliv2 generate source.md --skip-research --theme corporate-dark` and verify research is skipped

### Implementation (US2)

- [ ] T025 [US2] Add skip condition handling for research stage in cliv2/core/orchestrator.py
- [ ] T026 [US2] Add skip condition handling for theme stage (when preset theme provided) in cliv2/core/orchestrator.py
- [ ] T027 [US2] Add stop_after stage check in orchestrator loop in cliv2/core/orchestrator.py
- [ ] T028 [US2] Verify CLI already passes --skip-research, --theme, --stop-after to GenerationRequest (from T019)

### Validation (US2)

- [ ] T029 [US2] Manual test: `cliv2 generate source.md --skip-research` skips research stage
- [ ] T030 [US2] Manual test: `cliv2 generate source.md --theme cyber` uses preset theme
- [ ] T031 [US2] Manual test: `cliv2 generate source.md --stop-after storyline` stops after storyline

**Checkpoint**: Pipeline control options working

---

## Phase 5: User Story 3 - Use Custom Instructions (Priority: P2)

**Goal**: Support `--instruction` flag and optional `.cliv2.yaml` config file

**Independent Test**: Run `cliv2 generate source.md --instruction "Executive summary, 5 slides"` and verify output reflects constraints

### Implementation (US3)

- [ ] T032 [US3] Implement `cliv2/config/yaml_config.py` with load_yaml_config() for .cliv2.yaml
- [ ] T033 [US3] Update cliv2/config/__init__.py to merge config: CLI args > yaml file > env defaults
- [ ] T034 [US3] Update _build_context_suffix() in cliv2/core/agent.py to include instruction in agent context
- [ ] T035 [US3] Verify CLI already passes --instruction to GenerationRequest (from T019)

### Validation (US3)

- [ ] T036 [US3] Manual test: `cliv2 generate source.md -i "5 slides, executive tone"` includes instruction in generation
- [ ] T037 [US3] Manual test: Create .cliv2.yaml with default_theme, verify it's applied without CLI flag

**Checkpoint**: Custom instructions and config file working

---

## Phase 6: User Story 4 - View Pipeline Progress and Status (Priority: P3)

**Goal**: Add `--verbose` mode with detailed stage-by-stage progress output

**Independent Test**: Run `cliv2 generate source.md --verbose` and verify detailed progress is logged

### Implementation (US4)

- [ ] T038 [US4] Add stage timing (duration_ms) calculation in execute_stage() in cliv2/core/pipeline.py
- [ ] T039 [US4] Ensure progress_callback is called for each stage transition in cliv2/core/orchestrator.py
- [ ] T040 [US4] Enhance format_progress() in cliv2/interfaces/cli/formatters.py with timing info
- [ ] T041 [US4] Add final summary with total duration and stage breakdown in format_summary()

### Validation (US4)

- [ ] T042 [US4] Manual test: `cliv2 generate source.md -v` shows progress for each stage with timing
- [ ] T043 [US4] Manual test: Error during generation shows failed stage with error message

**Checkpoint**: Verbose mode with progress tracking working

---

## Phase 7: User Story 5 - Select Renderer (Priority: P3)

**Goal**: Add `--renderer antd|original` option for renderer selection

**Independent Test**: Run `cliv2 generate source.md --renderer original` and verify original components are used

### Implementation (US5)

- [ ] T044 [US5] Update _get_stage_prompt() in cliv2/core/pipeline.py to use correct skill based on renderer
- [ ] T045 [US5] Update _extract_stage_data() in cliv2/core/pipeline.py to set correct port (3001 for antd, 3000 for original)
- [ ] T046 [US5] Verify CLI already passes --renderer to GenerationRequest (from T019)

### Validation (US5)

- [ ] T047 [US5] Manual test: `cliv2 generate source.md --renderer antd` uses Ant Design renderer
- [ ] T048 [US5] Manual test: `cliv2 generate source.md --renderer original` uses original renderer

**Checkpoint**: Renderer selection working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, documentation, and final validation

- [ ] T049 [P] Add helpful error messages for missing AZURE_OPENAI_* environment variables in cliv2/config/llm.py
- [ ] T050 [P] Add error handling for source file not found in cliv2/interfaces/cli/main.py
- [ ] T051 [P] Add `cliv2 config --validate` command to check environment setup in cliv2/interfaces/cli/main.py
- [ ] T052 Update quickstart.md with actual working examples
- [ ] T053 Run quickstart.md validation: follow all steps and verify they work

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ─────────┐
                        ▼
Phase 2: Foundational ──┤ BLOCKS all user stories
                        │
                        ├──▶ Phase 3: US1 (P1) MVP ──▶ DEPLOY/TEST
                        │
                        ├──▶ Phase 4: US2 (P2) ──────▶ Stage Control
                        │
                        ├──▶ Phase 5: US3 (P2) ──────▶ Custom Instructions
                        │
                        ├──▶ Phase 6: US4 (P3) ──────▶ Verbose Mode
                        │
                        └──▶ Phase 7: US5 (P3) ──────▶ Renderer Selection
                                                              │
                                                              ▼
                                              Phase 8: Polish ─────▶ DONE
```

### Within Each User Story

1. Core implementation before CLI integration
2. CLI integration before validation
3. Validation confirms story works independently

### Parallel Opportunities

**Phase 1 (all [P] tasks can run in parallel)**:
```bash
T002, T003, T004, T005, T006  # All module __init__.py files
```

**Phase 2 (after T008)**:
```bash
T009, T012, T013  # Models, MCP config, Skill loader (independent)
```

**Phase 8 (all [P] tasks can run in parallel)**:
```bash
T049, T050, T051  # Error handling tasks (different files)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T013)
3. Complete Phase 3: User Story 1 (T014-T024)
4. **STOP and VALIDATE**: Run `cliv2 generate examples/pitch.md`
5. ✅ MVP deployed - CLI generates slides end-to-end

### Incremental Delivery

| Increment | Stories | Commands Working |
|-----------|---------|------------------|
| MVP | US1 | `cliv2 generate source.md` |
| +Control | US1+US2 | `--skip-research`, `--theme`, `--stop-after` |
| +Custom | US1-US3 | `--instruction`, `.cliv2.yaml` |
| +Verbose | US1-US4 | `--verbose` with progress |
| Complete | US1-US5 | `--renderer antd|original` |

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 53 |
| **Setup Tasks** | 7 |
| **Foundational Tasks** | 6 |
| **US1 (MVP) Tasks** | 11 |
| **US2 Tasks** | 7 |
| **US3 Tasks** | 6 |
| **US4 Tasks** | 6 |
| **US5 Tasks** | 5 |
| **Polish Tasks** | 5 |
| **Parallel Opportunities** | 15 tasks marked [P] |

### MVP Scope (Minimum for Runnable CLI)

- **Phase 1**: T001-T007 (package setup)
- **Phase 2**: T008-T013 (core models, config, skill/tool loading)
- **Phase 3**: T014-T024 (orchestrator, pipeline, CLI)

**MVP Task Count**: 24 tasks → Runnable `cliv2 generate source.md` command
