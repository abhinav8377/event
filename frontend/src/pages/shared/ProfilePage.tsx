"use client"

import { useState } from "react"
import dayjs from "dayjs"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { updateProfile, changePassword } from "@/features/auth/authSlice"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button, Input, Badge } from "@/components/common/ui"

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()
  const [name, setName] = useState(user.name)
  const [organization, setOrganization] = useState(user.organization ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const save = async () => {
    if (name.trim().length < 2) {
      dispatch(pushToast({ type: "error", message: "Name must be at least 2 characters" }))
      return
    }
    try {
      await dispatch(
        updateProfile({
          name: name.trim(),
          organization: user.role === "ORGANIZER" ? organization.trim() || undefined : user.organization,
        }),
      ).unwrap()
      dispatch(pushToast({ type: "success", message: "Profile updated" }))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as string) || "Failed to update profile" }))
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      dispatch(pushToast({ type: "error", message: "Passwords do not match" }))
      return
    }
    if (newPassword.length < 6) {
      dispatch(pushToast({ type: "error", message: "Password must be at least 6 characters" }))
      return
    }
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap()
      dispatch(pushToast({ type: "success", message: "Password changed successfully" }))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as string) || "Failed to change password" }))
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" description="Manage your account information." />

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground">
            {user.name.charAt(0)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground">{user.name}</p>
              <Badge variant="accent">{user.role}</Badge>
              {user.verified && <Badge variant="success">Verified</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              Member since {dayjs(user.joinedAt).format("MMMM YYYY")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Input id="profile-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="profile-email" label="Email" value={user.email} disabled />
          {user.role === "ORGANIZER" && (
            <Input
              id="profile-org"
              label="Organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Your organization name"
            />
          )}
          <div>
            <Button onClick={save}>Save changes</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-bold text-foreground">Change password</h2>
        <div className="flex flex-col gap-4">
          <Input
            id="current-password"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            id="new-password"
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            id="confirm-password"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div>
            <Button onClick={handleChangePassword} variant="outline">Change password</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
