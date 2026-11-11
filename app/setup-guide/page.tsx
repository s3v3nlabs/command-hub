import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Window } from "@/components/ui/window"
import { BookOpenIcon } from "lucide-react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TypographyHeading2 } from "@/components/ui/typography"

export default function SetupGuidePage() {
  return (
    <div className="hub-shell flex bg-dark-base text-dark-800 dot-bg">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="BLACKFRAME SETUP GUIDE" />
        <main className="hub-shell-scroll p-6">
          <Window
            title="ENVIRONMENT SETUP"
            icon={<BookOpenIcon size={16} />}
            variant="glass"
            size="full"
            className="mb-6"
          >
            <TechPanel cornerAccent borderAccent className="mb-6">
              <TypographyHeading2 className="mb-4">Environment Variables Setup Guide</TypographyHeading2>
              <div className="prose prose-invert max-w-none">
                <h2>Setting Up Environment Variables</h2>
                <p>
                  BLACKFRAME requires several environment variables to be set for full functionality. This guide will
                  help you set them up correctly.
                </p>

                <h3>Local Development Setup</h3>
                <p>
                  For local development, create a <code>.env.local</code> file in the root of your project with the
                  following variables:
                </p>

                <pre className="bg-dark-200 p-4 rounded-md overflow-x-auto">
                  {`# BLACKFRAME Core Settings
BLACKFRAME_MODE=autonomy
GOVERNOR_MODE=gatekeeper
REPLAY_APPROVED_ONLY=true
BLACKFRAME_NODE_ID=local-dev-1
LOG_CHANNEL=console

# AI Integration
AI_MODEL=gpt-4o
OPENAI_API_KEY=your_openai_key_here
XAI_API_KEY=your_xai_key_here
GROQ_API_KEY=your_groq_key_here

# Voice Alerts
LMNT_KEY=your_lmnt_key_here

# Database (if using)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here`}
                </pre>

                <h3>Vercel Deployment</h3>
                <p>
                  When deploying to Vercel, add these environment variables in the Vercel dashboard under Project
                  Settings &gt; Environment Variables.
                </p>
              </div>
            </TechPanel>

            <TechPanel cornerAccent borderAccent>
              <TypographyHeading2 className="mb-4">Troubleshooting</TypographyHeading2>
              <div className="prose prose-invert max-w-none">
                <h3>Common Issues</h3>

                <h4>Voice Alerts Not Working</h4>
                <p>If voice alerts aren't working:</p>
                <ul>
                  <li>Verify your LMNT_KEY is correctly set</li>
                  <li>Check browser console for any API errors</li>
                  <li>Ensure your browser allows audio playback</li>
                  <li>Try a shorter text message first</li>
                </ul>

                <h4>Self-Healing Process Fails</h4>
                <p>If the self-healing process fails:</p>
                <ul>
                  <li>Check BLACKFRAME_MODE and GOVERNOR_MODE settings</li>
                  <li>Look for specific error messages in the logs</li>
                  <li>Verify that all required environment variables are set</li>
                  <li>Try resetting the workflow and starting again</li>
                </ul>
              </div>
            </TechPanel>
          </Window>
        </main>
      </div>
    </div>
  )
}
