"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Search, Brain, Award, FileText, Download, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { speak } from "@/lib/audio"

interface Candidate {
  id: string
  name: string
  age: number
  location: string
  education: string
  skills: string[]
  experience: string[]
  oeScore: number
  oeProfile: "analytical" | "creative" | "tactical" | "strategic" | "unknown"
  riskFactors: string[]
  notes: string
}

export function RecruitmentModule() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "assessment" | "notes">("profile")

  const candidates: Candidate[] = [
    {
      id: "c1",
      name: "Alex Chen",
      age: 28,
      location: "Boston, MA",
      education: "Ph.D. in Computer Science, MIT",
      skills: ["Cryptography", "Machine Learning", "Algorithm Design", "Python", "C++"],
      experience: [
        "Research Assistant, MIT Cryptography Lab (3 years)",
        "Software Engineer, Tech Innovations Inc. (2 years)",
        "Cybersecurity Consultant, SecureNet (1 year)",
      ],
      oeScore: 92,
      oeProfile: "analytical",
      riskFactors: ["Foreign travel to restricted countries", "Online privacy advocate"],
      notes:
        "Exceptional problem-solving abilities. Shows high aptitude for complex cryptographic systems. Recommended for advanced technical track.",
    },
    {
      id: "c2",
      name: "Morgan Taylor",
      age: 32,
      location: "Seattle, WA",
      education: "M.S. in Cognitive Science, Stanford University",
      skills: ["Natural Language Processing", "Behavioral Analysis", "Social Engineering", "Java", "R"],
      experience: [
        "Behavioral Analyst, Human Factors Research (4 years)",
        "Intelligence Analyst, Government Contractor (3 years)",
      ],
      oeScore: 87,
      oeProfile: "strategic",
      riskFactors: ["Financial instability", "Previous security clearance issues"],
      notes:
        "Strong strategic thinking and pattern recognition. Excellent at identifying human vulnerabilities in systems. Consider for intelligence analysis division.",
    },
  ]

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    speak(`Searching for candidate ${searchQuery}`)

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false)

      // Find matching candidate
      const candidate = candidates.find((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

      if (candidate) {
        setSelectedCandidate(candidate)
        speak(`Candidate profile found for ${candidate.name}`)
      } else {
        speak("No matching candidates found")
      }
    }, 1500)
  }

  const getOEProfileColor = (profile: string) => {
    switch (profile) {
      case "analytical":
        return "text-blue-400 border-blue-500 bg-blue-900/20"
      case "creative":
        return "text-purple-400 border-purple-500 bg-purple-900/20"
      case "tactical":
        return "text-green-400 border-green-500 bg-green-900/20"
      case "strategic":
        return "text-amber-400 border-amber-500 bg-amber-900/20"
      default:
        return "text-gray-400 border-gray-500 bg-gray-900/20"
    }
  }

  const getOEScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400"
    if (score >= 80) return "text-blue-400"
    if (score >= 70) return "text-amber-400"
    return "text-red-400"
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-500" />
          Recruitment & OE Profiler
        </CardTitle>
        {selectedCandidate && (
          <button
            onClick={() => speak("Exporting candidate profile")}
            className="text-gray-400 hover:text-white transition-colors"
            title="Export Profile"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name..."
            className="flex-grow bg-dark-200 border border-dark-300 rounded p-2 text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {selectedCandidate ? (
          <div>
            <div className="flex mb-4">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-1 ${
                  activeTab === "profile"
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("assessment")}
                className={`px-3 py-1 ${
                  activeTab === "assessment"
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                OE Assessment
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-3 py-1 ${
                  activeTab === "notes" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Notes
              </button>
            </div>

            {activeTab === "profile" && (
              <div>
                <div className="mb-4 p-4 bg-dark-200 rounded-md">
                  <h3 className="text-xl font-bold mb-2">{selectedCandidate.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <div>
                      <div className="text-sm text-gray-400">Age</div>
                      <div>{selectedCandidate.age}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Location</div>
                      <div>{selectedCandidate.location}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-400">Education</div>
                      <div>{selectedCandidate.education}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, index) => (
                        <Badge key={index} className="bg-dark-300 text-gray-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Experience</div>
                    <ul className="list-disc list-inside">
                      {selectedCandidate.experience.map((exp, index) => (
                        <li key={index} className="text-sm">
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assessment" && (
              <div>
                <div className="mb-4 p-4 bg-dark-200 rounded-md">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm text-gray-400">OE Score</div>
                      <div className={`text-2xl font-bold ${getOEScoreColor(selectedCandidate.oeScore)}`}>
                        {selectedCandidate.oeScore}/100
                      </div>
                    </div>
                    <Badge className={`${getOEProfileColor(selectedCandidate.oeProfile)}`}>
                      <Brain className="h-3 w-3 mr-1" />
                      {selectedCandidate.oeProfile.charAt(0).toUpperCase() + selectedCandidate.oeProfile.slice(1)}{" "}
                      Profile
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-dark-300 rounded-md">
                      <div className="font-medium mb-1 flex items-center">
                        <Brain className="h-4 w-4 mr-1 text-blue-400" />
                        Cognitive Aptitude
                      </div>
                      <div className="h-2 bg-dark-400 rounded-full mb-1">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${selectedCandidate.oeProfile === "analytical" ? 90 : 75}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedCandidate.oeProfile === "analytical" ? "Exceptional" : "Above Average"}
                      </div>
                    </div>

                    <div className="p-3 bg-dark-300 rounded-md">
                      <div className="font-medium mb-1 flex items-center">
                        <Award className="h-4 w-4 mr-1 text-purple-400" />
                        Adaptability
                      </div>
                      <div className="h-2 bg-dark-400 rounded-full mb-1">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${selectedCandidate.oeProfile === "creative" ? 90 : 70}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedCandidate.oeProfile === "creative" ? "Exceptional" : "Average"}
                      </div>
                    </div>

                    <div className="p-3 bg-dark-300 rounded-md">
                      <div className="font-medium mb-1 flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-green-400" />
                        Operational Efficiency
                      </div>
                      <div className="h-2 bg-dark-400 rounded-full mb-1">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${selectedCandidate.oeProfile === "tactical" ? 90 : 65}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedCandidate.oeProfile === "tactical" ? "Exceptional" : "Average"}
                      </div>
                    </div>

                    <div className="p-3 bg-dark-300 rounded-md">
                      <div className="font-medium mb-1 flex items-center">
                        <Search className="h-4 w-4 mr-1 text-amber-400" />
                        Strategic Vision
                      </div>
                      <div className="h-2 bg-dark-400 rounded-full mb-1">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${selectedCandidate.oeProfile === "strategic" ? 90 : 80}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedCandidate.oeProfile === "strategic" ? "Exceptional" : "Above Average"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Risk Factors</div>
                    {selectedCandidate.riskFactors.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCandidate.riskFactors.map((risk, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-dark-300 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-sm">{risk}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">No significant risk factors identified</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div>
                <div className="mb-4 p-4 bg-dark-200 rounded-md">
                  <h4 className="font-medium mb-2">Recruitment Notes</h4>
                  <p className="whitespace-pre-wrap">{selectedCandidate.notes}</p>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Add Note</h4>
                    <textarea
                      className="w-full bg-dark-300 border border-dark-400 rounded p-2 text-sm"
                      rows={4}
                      placeholder="Add your notes about this candidate..."
                    ></textarea>
                    <button
                      onClick={() => speak("Note saved")}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedCandidate(null)}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Back to search
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <User className="h-12 w-12 mb-2 opacity-30" />
            <p>Search for a candidate by name</p>
            <p className="text-sm mt-1">Try "Alex" or "Morgan"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecruitmentModule
