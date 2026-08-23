import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";
import { theme } from "@/theme";

const BYTES_PER_KB = 1024;
const MAX_AVATAR_MB = 2;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * BYTES_PER_KB * BYTES_PER_KB;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  if (bytes < BYTES_PER_KB * BYTES_PER_KB) {
    return `${(bytes / BYTES_PER_KB).toFixed(0)} KB`;
  }

  return `${(bytes / (BYTES_PER_KB * BYTES_PER_KB)).toFixed(2)} MB`;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
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
        description: `Avatar file must be ${MAX_AVATAR_MB}MB or smaller.`,
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
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
          <CardHeader>
            <CardTitle>Teacher Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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

              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
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
                  className="w-full sm:w-auto"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                >
                  Change Photo
                </Button>

                {selectedAvatarFile ? (
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
                    onClick={() => removeAvatarMutation.mutate()}
                    disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                  >
                    {removeAvatarMutation.isPending ? "Removing..." : "Remove Photo"}
                  </Button>
                ) : null}
              </div>

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, or WebP only. Max {MAX_AVATAR_MB}MB.
                </p>
                {selectedAvatarFile ? (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedAvatarFile.name} ({formatFileSize(selectedAvatarFile.size)})
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={user?.email || ""} readOnly />
            </div>

            <Button
              type="button"
              className="w-full sm:w-auto"
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

        <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <PasswordInput id="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput id="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <PasswordInput id="confirm-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
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
    </>
  );
}
