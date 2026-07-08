"use client"

import { useState } from "react"
import useSWR from "swr"
import dayjs from "dayjs"
import { Award, Download, Eye } from "lucide-react"
import { useAppSelector } from "@/app/store"
import * as certificateApi from "@/api/certificateApi"
import { PageHeader } from "@/components/common/PageHeader"
import { Modal } from "@/components/common/Modal"
import { Card, Button, Loader, EmptyState } from "@/components/common/ui"
import type { Certificate } from "@/constants/types"

function CertificatePreview({ cert }: { cert: Certificate }) {
  return (
    <div className="rounded-xl border-4 border-primary/20 bg-card p-8 text-center">
      <Award className="mx-auto size-10 text-primary" aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Certificate of Participation
      </p>
      <p className="mt-4 text-sm text-muted-foreground">This certifies that</p>
      <p className="mt-1 text-2xl font-extrabold text-foreground">{cert.userName}</p>
      <p className="mt-2 text-sm text-muted-foreground">successfully participated in</p>
      <p className="mt-1 font-bold text-foreground text-balance">{cert.eventTitle}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        Issued on {dayjs(cert.issuedAt).format("MMMM D, YYYY")}
      </p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{cert.certificateNumber}</p>
    </div>
  )
}

export default function MyCertificates() {
  const user = useAppSelector((s) => s.auth.user)!
  const [preview, setPreview] = useState<Certificate | null>(null)

  const { data: certs } = useSWR(["my-certificates", user.id], () =>
    certificateApi.getMyCertificates(user.id).then((r) => r.data),
  )

  if (!certs) return <Loader />

  const download = async (cert: Certificate) => {
    try {
      const blob = await certificateApi.downloadCertificate(cert.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${cert.certificateNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      const text = [
        "CERTIFICATE OF PARTICIPATION",
        "",
        `This certifies that ${cert.userName}`,
        `successfully participated in ${cert.eventTitle}.`,
        "",
        `Issued: ${dayjs(cert.issuedAt).format("MMMM D, YYYY")}`,
        `Certificate No: ${cert.certificateNumber}`,
      ].join("\n")
      const blob = new Blob([text], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${cert.certificateNumber}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Certificates"
        description="Certificates earned from events you've attended."
      />

      {certs.length === 0 ? (
        <EmptyState
          icon={<Award className="size-10" aria-hidden="true" />}
          title="No certificates yet"
          description="Attend events and get marked present to earn participation certificates."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert: Certificate) => (
            <Card key={cert.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Award className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-balance">{cert.eventTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Issued {dayjs(cert.issuedAt).format("MMM D, YYYY")}
                  </p>
                </div>
              </div>
              <p className="mt-3 font-mono text-xs text-muted-foreground">{cert.certificateNumber}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreview(cert)}>
                  <Eye className="size-4" aria-hidden="true" />
                  Preview
                </Button>
                <Button size="sm" className="flex-1" onClick={() => download(cert)}>
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Certificate preview">
        {preview && <CertificatePreview cert={preview} />}
      </Modal>
    </div>
  )
}
