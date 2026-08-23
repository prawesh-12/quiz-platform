import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useToast } from "@/hooks/useToast";
import { getCredentials as getCredentialsApi } from "@/services/adminService";
import { copyToClipboard } from "@/utils/clipboard";

const CLOSED_DIALOG = {
  open: false,
  teacherName: "",
  data: null,
  password: null,
  oneTime: false
};

function useCopyState() {
  const [hasCopied, setHasCopied] = useState(false);
  const [copyConfirmed, setCopyConfirmed] = useState(false);

  const reset = () => {
    setHasCopied(false);
    setCopyConfirmed(false);
  };

  return { hasCopied, setHasCopied, copyConfirmed, setCopyConfirmed, reset };
}

function useCopyCredentials(dialog, copyState) {
  const { toast } = useToast();

  return async () => {
    const password = dialog.data?.password || dialog.password;
    if (!password) {
      return;
    }

    const text = `Email: ${dialog.data?.email || ""}\nPassword: ${password}`;
    if (await copyToClipboard(text)) {
      copyState.setHasCopied(true);
      toast({ title: "Copied", description: "Login credentials copied to clipboard." });
      return;
    }

    toast({
      title: "Copy failed",
      description: "Could not access the clipboard. Please copy the password manually.",
      variant: "destructive"
    });
  };
}

// In one-time mode the password can never be retrieved again, so block dismissal until copied.
function createOpenChangeHandler({ dialog, copyConfirmed, setDialog, close }) {
  return (open) => {
    if (!open && dialog.oneTime && !copyConfirmed) {
      return;
    }

    if (open) {
      setDialog((previous) => ({ ...previous, open: true }));
      return;
    }

    close();
  };
}

function buildNewTeacherDialog(teacher, password) {
  return {
    teacherName: teacher.name,
    data: { name: teacher.name, email: teacher.email },
    password,
    oneTime: true
  };
}

// Owns the credentials dialog for both an existing teacher and a freshly created one.
export function useTeacherCredentials() {
  const copyState = useCopyState();
  const [dialog, setDialog] = useState(CLOSED_DIALOG);

  const show = (next) => {
    copyState.reset();
    setDialog({ ...CLOSED_DIALOG, ...next, open: true });
  };

  const close = () => {
    setDialog((previous) => ({ ...previous, open: false }));
    copyState.reset();
  };

  const mutation = useMutation({
    mutationFn: async (teacher) => ({ response: await getCredentialsApi(teacher.id), teacher }),
    onSuccess: ({ response, teacher }) =>
      show({ teacherName: teacher.name, data: response?.credentials ?? null })
  });

  const copy = useCopyCredentials(dialog, copyState);

  return {
    dialog,
    hasCopied: copyState.hasCopied,
    copyConfirmed: copyState.copyConfirmed,
    setCopyConfirmed: copyState.setCopyConfirmed,
    isPending: mutation.isPending,
    request: mutation.mutate,
    close,
    copy,
    onOpenChange: createOpenChangeHandler({
      dialog,
      copyConfirmed: copyState.copyConfirmed,
      setDialog,
      close
    }),
    showForNewTeacher: (teacher, password) => show(buildNewTeacherDialog(teacher, password))
  };
}
