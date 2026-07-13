import {
  serializeProjectComposition
} from "./serializer.js";

const PROJECT_STORAGE_PREFIX =
  "exhibition-project:";

const ACTIVE_PROJECT_KEY =
  "exhibition-active-project";

const projects = new Map();

let activeProject = null;

const projectListeners = new Set();

function createProjectId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ä]/g, "a")
    .replace(/[ö]/g, "o")
    .replace(/[ü]/g, "u")
    .replace(/[õ]/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emitProjectChange() {
  projectListeners.forEach((listener) => {
    listener(activeProject);
  });
}

function getStorageKey(slug) {
  return `${PROJECT_STORAGE_PREFIX}${slug}`;
}

export function createProject({
  title,
  slug,
  description = ""
}) {
  if (!title?.trim()) {
    throw new Error(
      "Project title is required."
    );
  }

  const normalizedSlug =
    normalizeSlug(slug || title);

  if (!normalizedSlug) {
    throw new Error(
      "Project slug could not be created."
    );
  }

  const project = {
    id: createProjectId(),
    slug: normalizedSlug,
    title: title.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects.set(
    project.slug,
    project
  );

  setActiveProject(project);

  return project;
}

export function registerProject(project) {
  if (
    !project?.id ||
    !project?.slug ||
    !project?.title
  ) {
    throw new Error(
      "Cannot register an invalid project."
    );
  }

  projects.set(
    project.slug,
    project
  );

  return project;
}

export function setActiveProject(project) {
  if (!project) {
    activeProject = null;

    localStorage.removeItem(
      ACTIVE_PROJECT_KEY
    );

    emitProjectChange();
    return;
  }

  registerProject(project);

  activeProject = project;

  localStorage.setItem(
    ACTIVE_PROJECT_KEY,
    project.slug
  );

  emitProjectChange();
}

export function getActiveProject() {
  return activeProject;
}

export function getProject(slug) {
  return projects.get(slug) || null;
}

export function getProjects() {
  return [...projects.values()];
}

export function onActiveProjectChange(
  listener
) {
  if (typeof listener !== "function") {
    throw new TypeError(
      "Project listener must be a function."
    );
  }

  projectListeners.add(listener);

  return () => {
    projectListeners.delete(listener);
  };
}

export function saveProjectComposition({
  objects,
  camera,
  orbit
}) {
  if (!activeProject) {
    throw new Error(
      "No active exhibition project has been selected."
    );
  }

  const composition =
    serializeProjectComposition({
      project: activeProject,
      objects,
      camera,
      orbit
    });

  activeProject = {
    ...activeProject,
    updatedAt: composition.updatedAt
  };

  projects.set(
    activeProject.slug,
    activeProject
  );

  localStorage.setItem(
    getStorageKey(activeProject.slug),
    JSON.stringify(composition)
  );

  emitProjectChange();

  return composition;
}

export function loadProjectComposition(
  slug
) {
  const raw = localStorage.getItem(
    getStorageKey(slug)
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(
      `Project "${slug}" could not be read:`,
      error
    );

    return null;
  }
}

export function restoreActiveProject() {
  const slug = localStorage.getItem(
    ACTIVE_PROJECT_KEY
  );

  if (!slug) {
    return null;
  }

  const composition =
    loadProjectComposition(slug);

  if (!composition?.project) {
    return null;
  }

  registerProject(
    composition.project
  );

  setActiveProject(
    composition.project
  );

  return composition;
}

export function deleteProject(slug) {
  projects.delete(slug);

  localStorage.removeItem(
    getStorageKey(slug)
  );

  if (activeProject?.slug === slug) {
    setActiveProject(null);
  }
}