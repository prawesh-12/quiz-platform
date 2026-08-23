import UnitNameDialog from "@/components/teacher/UnitNameDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

function DeleteUnitDialog({ remove }) {
  return (
    <AlertDialog open={Boolean(remove.item)} onOpenChange={(open) => !open && remove.clear()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{remove.item?.name}&quot;? Questions in this unit
            will be moved to &quot;Uncategorized&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => remove.mutation.mutate(remove.item.id)}
          >
            {remove.mutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function UnitDialogs({ unit }) {
  const { create, rename, remove } = unit;

  return (
    <>
      <UnitNameDialog
        open={create.isOpen}
        onOpenChange={create.setIsOpen}
        title="Create Unit"
        description="Add a new unit to organize questions."
        inputId="new-unit-name"
        placeholder="e.g. Algebra"
        value={create.name}
        onValueChange={create.setName}
        onSubmit={() => create.mutation.mutate(create.name)}
        isPending={create.mutation.isPending}
        submitLabel="Create"
        pendingLabel="Creating..."
      />

      <UnitNameDialog
        open={Boolean(rename.item)}
        onOpenChange={(open) => !open && rename.clear()}
        title="Rename Unit"
        description="Update unit name for this subject."
        inputId="rename-unit-name"
        value={rename.name}
        onValueChange={rename.setName}
        onSubmit={() => rename.mutation.mutate({ id: rename.item.id, name: rename.name.trim() })}
        isPending={rename.mutation.isPending}
        submitLabel="Save"
        pendingLabel="Saving..."
      />

      <DeleteUnitDialog remove={remove} />
    </>
  );
}
