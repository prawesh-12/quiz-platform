import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";
import { subjectService } from "@/services/subjectService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, setUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => authService.updateProfile(payload),
    onSuccess: (data) => {
      setUser(data.user);
      toast({ title: "Profile updated", description: "Your profile details were saved." });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => authService.changePassword(payload),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed", description: "Password updated successfully." });
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id) => subjectService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setSubjectToDelete(null);
      toast({ title: "Subject deleted", description: "Subject and related units were removed." });
    }
  });

  const initials = (name || "T")
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");

  return (
    <TeacherShell
      subjects={subjectsQuery.data?.subjects || []}
      selectedSubjectId={null}
      onSelectSubject={(subjectId) => navigate(`/teacher/questions/${subjectId}`)}
      onOpenCreateSubject={() => navigate("/teacher")}
      user={user}
      onLogout={logout}
      onOpenProfile={() => navigate("/teacher/profile")}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teacher Profile</CardTitle>
            <CardDescription>Manage your account details and password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={avatarUrl || undefined} alt={name || "Teacher"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <Label>Upload Photo (URL)</Label>
                <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} readOnly />
            </div>

            <Button
              type="button"
              onClick={() =>
                updateProfileMutation.mutate({
                  name: name.trim(),
                  avatar_url: avatarUrl.trim() || null
                })
              }
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <Button
              type="button"
              onClick={() =>
                changePasswordMutation.mutate({
                  current_password: currentPassword,
                  new_password: newPassword,
                  confirm_new_password: confirmPassword
                })
              }
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Updating..." : "Save Password"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>Delete subjects you no longer need.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(subjectsQuery.data?.subjects || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available.</p>
            ) : (
              (subjectsQuery.data?.subjects || []).map((subject) => (
                <div key={subject.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <p className="text-sm font-medium">{subject.name}</p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setSubjectToDelete(subject)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(subjectToDelete)} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
            <AlertDialogDescription>
              "{subjectToDelete?.name}" will be deleted along with its units and subject-bank questions.
              If quizzes still reference this subject, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubjectMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteSubjectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => subjectToDelete && deleteSubjectMutation.mutate(subjectToDelete.id)}
            >
              {deleteSubjectMutation.isPending ? "Deleting..." : "Delete subject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TeacherShell>
  );
}
