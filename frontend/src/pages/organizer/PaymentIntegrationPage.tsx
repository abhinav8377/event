"use client"

import { useState, useEffect } from "react"
import { CreditCard, Trash2, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { useAppDispatch } from "@/app/store"
import {
  getPaymentIntegration,
  savePaymentIntegration,
  deletePaymentIntegration,
} from "@/api/paymentApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Modal } from "@/components/common/Modal"
import { Card, Button, Input, Loader } from "@/components/common/ui"
import type { PaymentIntegration } from "@/constants/types"

export default function PaymentIntegrationPage() {
  const dispatch = useAppDispatch()

  const [integration, setIntegration] = useState<PaymentIntegration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const [keyId, setKeyId] = useState("")
  const [keySecret, setKeySecret] = useState("")
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    getPaymentIntegration()
      .then((res) => {
        setIntegration(res.data)
        if (res.data) {
          setKeyId(res.data.razorpayKeyId)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!keyId.trim() || !keySecret.trim()) {
      dispatch(pushToast({ type: "error", message: "Both Key ID and Key Secret are required" }))
      return
    }
    if (!keyId.startsWith("rzp_")) {
      dispatch(pushToast({ type: "error", message: "Invalid Razorpay Key ID format" }))
      return
    }

    setSaving(true)
    try {
      const res = await savePaymentIntegration({
        razorpayKeyId: keyId.trim(),
        razorpayKeySecret: keySecret.trim(),
      })
      setIntegration(res.data)
      setKeySecret("")
      dispatch(pushToast({ type: "success", message: res.message }))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message || "Failed to save integration" }))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePaymentIntegration()
      setIntegration(null)
      setKeyId("")
      setKeySecret("")
      setDeleteModal(false)
      dispatch(pushToast({ type: "success", message: "Payment integration removed" }))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message || "Failed to remove integration" }))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loader label="Loading payment settings..." />

  return (
    <div>
      <PageHeader
        title="Payment Integration"
        description="Set up Razorpay to accept payments for your paid events."
      />

      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Razorpay Integration</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your Razorpay account to accept payments for paid events. Each organizer has their own independent integration.
              </p>
            </div>
          </div>

          {integration ? (
            <div className="mt-6 rounded-lg border border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-success" />
                <p className="text-sm font-semibold text-success">Integration Active</p>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Key ID:</span>
                  <span className="font-mono text-xs text-foreground">{integration.razorpayKeyId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Secret:</span>
                  <span className="font-mono text-xs text-foreground">••••••••</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4"
                onClick={() => setDeleteModal(true)}
              >
                <Trash2 className="size-3.5" />
                Remove Integration
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <p className="text-sm text-muted-foreground">
                    No payment integration configured. Set up your Razorpay credentials below to start accepting payments.
                  </p>
                </div>
              </div>

              <Input
                id="keyId"
                label="Razorpay Key ID"
                placeholder="rzp_test_xxxxxxxxxxxxxxxx"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="keySecret" className="text-sm font-medium text-foreground">
                  Razorpay Key Secret
                </label>
                <div className="flex gap-2">
                  <input
                    id="keySecret"
                    type={showSecret ? "text" : "password"}
                    placeholder="Enter your Razorpay Key Secret"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>

              <Button loading={saving} onClick={handleSave}>
                Save Integration
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold text-foreground">How it works</h3>
          <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
              <span>Create a Razorpay account at <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">dashboard.razorpay.com</a> if you don&apos;t have one.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              <span>Go to Settings &gt; API Keys and generate your Key ID and Key Secret.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
              <span>Enter your credentials above. Your integration is per-organizer and independent from others.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
              <span>When creating events, set a price to make them paid. Users will see the Razorpay checkout after filling the registration form.</span>
            </li>
          </ol>
        </Card>
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Remove Integration">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Are you sure you want to remove your Razorpay integration? Paid events will no longer accept payments until you set up a new integration.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" loading={deleting} onClick={handleDelete}>
            Remove Integration
          </Button>
        </div>
      </Modal>
    </div>
  )
}
