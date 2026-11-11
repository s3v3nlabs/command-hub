"use client"

import { Sidebar } from "@/components/layout/sidebar"
import HarmonicCalibration from "@/components/CommandHub/modules/HarmonicCalibration"

export default function HarmonicCalibrationPage() {
  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <HarmonicCalibration />
        </div>
      </div>
    </div>
  )
}
