# PLANTED DEFECT (convention-drift / BF5) — overlay → src/freelancer_app/tags/tagService.py
#
# DEFECT: new code ignores the captured CONVENTION_BASELINE and falls back to canon DEFAULTS:
#   - layout: invents a NEW top-level package `freelancer_app/tags/` instead of extending the existing
#     project_management package (CONVENTION_BASELINE: one package per component).
#   - naming: camelCase module file `tagService.py` + camelCase methods (setLabel) — the captured idiom is
#     snake_case module files (project_store.py) + snake_case methods.
#   - error-handling: SWALLOWS the CT2 store-unavailable failure (returns None) instead of propagating it
#     unmodified — diverges from the baseline propagate-not-catch idiom.
# CRITIQUE (BF5) MUST flag convention-drift and BLOCK. Golden code (project_management/project_label.py)
# conforms on all four axes.

class TagService:                                              # canon-default class style, new package
    def __init__(self, dataStore):                             # camelCase param — drift
        self.dataStore = dataStore

    def setLabel(self, projectId, ownerId, label):             # camelCase method — drift
        try:
            return self.dataStore.update_project(projectId, ownerId, {"label": label})
        except Exception:                                      # swallows CT2 failure modes — drift
            return None
