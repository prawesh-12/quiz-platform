import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const { toast } = useToast();

  const avatarInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const clearAvatarSelection = () => {
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl("");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };


  const updateProfileMutation = useMutation({
    mutationFn: (payload) => authService.updateProfile(payload),
    onSuccess: (data) => {
      setUser(data.user);
      toast({ title: "Profile updated", description: "Your profile details were saved." });
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => authService.uploadAvatar(file),
    onSuccess: () => {
      setUser({ has_avatar: true });
      clearAvatarSelection();
      toast({ title: "Avatar updated", description: "Your profile photo has been uploaded." });
    }
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => authService.removeAvatar(),
    onSuccess: () => {
      setUser({ has_avatar: false });
      clearAvatarSelection();
      toast({ title: "Avatar removed", description: "Your profile photo has been removed." });
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


  const onAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Only JPEG, PNG, or WebP images are allowed.",
        variant: "destructive"
      });
      clearAvatarSelection();
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast({
        title: "File too large",
        description: "Avatar file must be 2MB or smaller.",
        variant: "destructive"
      });
      clearAvatarSelection();
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <TeacherShell
      subjects={[]}
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {avatarPreviewUrl ? (
                <img
                  src={avatarPreviewUrl}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <Avatar
                  teacherId={user?.id}
                  name={name || user?.name || "Teacher"}
                  size="xl"
                  hasAvatar={Boolean(user?.has_avatar)}
                />
              )}

              <div className="flex min-w-[220px] flex-1 flex-wrap items-center gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onAvatarFileChange}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                >
                  Change Photo
                </Button>

                {selectedAvatarFile ? (
                  <Button
                    type="button"
                    onClick={() => uploadAvatarMutation.mutate(selectedAvatarFile)}
                    disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                  >
                    {uploadAvatarMutation.isPending ? "Uploading..." : "Upload Photo"}
                  </Button>
                ) : null}

                {user?.has_avatar ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeAvatarMutation.mutate()}
                    disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                  >
                    {removeAvatarMutation.isPending ? "Removing..." : "Remove Photo"}
                  </Button>
                ) : null}
              </div>

              <div className="w-full">
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, or WebP only. Max 2MB.
                </p>
                {selectedAvatarFile ? (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedAvatarFile.name} ({formatFileSize(selectedAvatarFile.size)})
                  </p>
                ) : null}
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
                  name: name.trim()
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
              <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
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

      </div>
    </TeacherShell>
  );
}
