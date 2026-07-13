const undoStack = [];
const redoStack = [];

function normalizeObjects(objects) {
  if (!objects) {
    return [];
  }

  return Array.isArray(objects)
    ? objects.filter(Boolean)
    : [objects];
}

export function createHistorySnapshot(objects) {
  return normalizeObjects(objects).map(
    (object) => ({
      object,

      position: object.position.clone(),
      quaternion: object.quaternion.clone(),
      scale: object.scale.clone()
    })
  );
}

function applySnapshot(snapshot) {
  if (!Array.isArray(snapshot)) {
    return;
  }

  snapshot.forEach((state) => {
    if (!state?.object) {
      return;
    }

    state.object.position.copy(
      state.position
    );

    state.object.quaternion.copy(
      state.quaternion
    );

    state.object.scale.copy(
      state.scale
    );

    state.object.updateMatrixWorld(true);
  });
}

export function pushHistory(
  before,
  after
) {
  if (
    !Array.isArray(before) ||
    !Array.isArray(after) ||
    before.length === 0
  ) {
    return;
  }

  undoStack.push({
    before,
    after
  });

  if (undoStack.length > 50) {
    undoStack.shift();
  }

  redoStack.length = 0;
}

export function undo() {
  const action = undoStack.pop();

  if (!action) {
    return;
  }

  applySnapshot(action.before);
  redoStack.push(action);
}

export function redo() {
  const action = redoStack.pop();

  if (!action) {
    return;
  }

  applySnapshot(action.after);
  undoStack.push(action);
}

export function clearHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
}