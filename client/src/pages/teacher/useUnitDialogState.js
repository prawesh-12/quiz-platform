import { useState } from "react";

import { useUnitMutations } from "@/pages/teacher/useUnitMutations";

function useCreateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const reset = () => {
    setIsOpen(false);
    setName("");
  };

  return { isOpen, setIsOpen, open: () => setIsOpen(true), name, setName, reset };
}

function useRenameDialog() {
  const [item, setItem] = useState(null);
  const [name, setName] = useState("");

  const start = (unit) => {
    setItem(unit);
    setName(unit.name);
  };

  const reset = () => {
    setItem(null);
    setName("");
  };

  return { item, name, setName, start, clear: () => setItem(null), reset };
}

// One controller for the create/rename/delete unit dialogs, so the page only wires the triggers.
export function useUnitDialogState(subjectId) {
  const create = useCreateDialog();
  const rename = useRenameDialog();
  const [deleteItem, setDeleteItem] = useState(null);

  const { createUnit, deleteUnit, renameUnit } = useUnitMutations(subjectId, {
    onCreated: create.reset,
    onDeleted: () => setDeleteItem(null),
    onRenamed: rename.reset
  });

  return {
    create: { ...create, mutation: createUnit },
    rename: { ...rename, mutation: renameUnit },
    remove: {
      item: deleteItem,
      select: setDeleteItem,
      clear: () => setDeleteItem(null),
      mutation: deleteUnit
    }
  };
}
