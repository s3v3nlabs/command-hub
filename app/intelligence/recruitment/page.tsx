import { RecruitmentModule } from "@/components/CommandHub/legacy/RecruitmentModule"
import { TechPanel } from "@/components/ui/tech-panel"
import Link from "next/link"
import { TechButton } from "@/components/ui/tech-button"

export default function RecruitmentAnalysisPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-green-400">Recruitment Analysis</h1>
        <Link href="/intelligence">
          <TechButton variant="outline" size="sm">
            Back to Intelligence Hub
          </TechButton>
        </Link>
      </div>

      <TechPanel>
        <RecruitmentModule />
      </TechPanel>
    </div>
  )
}
