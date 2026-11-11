"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, User, Mail, Globe, Phone, MapPin, Shield, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { speak } from "@/lib/audio"

interface Profile {
  id: string
  name: string
  email: string
  phone: string
  location: string
  socialProfiles: {
    platform: string
    username: string
    url: string
  }[]
  leaks: {
    source: string
    date: string
    dataType: string
    severity: "high" | "medium" | "low"
  }[]
  aliases: string[]
}

export default function OSINTDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "leaks" | "aliases">("profile")

  const profiles: Profile[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      location: "New York, USA",
      socialProfiles: [
        { platform: "Twitter", username: "jsmith", url: "https://twitter.com/jsmith" },
        { platform: "LinkedIn", username: "johnsmith", url: "https://linkedin.com/in/johnsmith" },
        { platform: "GitHub", username: "jsmith-dev", url: "https://github.com/jsmith-dev" },
      ],
      leaks: [
        { source: "CompanyX Breach", date: "2022-03-15", dataType: "Email, Password", severity: "high" },
        { source: "ServiceY Hack", date: "2021-08-22", dataType: "Name, Phone", severity: "medium" },
      ],
      aliases: ["Johnny", "JS", "John S."],
    },
    {
      id: "2",
      name: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "+1 (555) 987-6543",
      location: "London, UK",
      socialProfiles: [
        { platform: "Instagram", username: "janedoe", url: "https://instagram.com/janedoe" },
        { platform: "Facebook", username: "jane.doe", url: "https://facebook.com/jane.doe" },
      ],
      leaks: [{ source: "ForumZ Database", date: "2023-01-10", dataType: "Email, IP Address", severity: "medium" }],
      aliases: ["JD", "Jane D."],
    },
  ]

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    speak(`Searching for ${searchQuery}`)

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false)

      // Find matching profile
      const profile = profiles.find(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())),
      )

      if (profile) {
        setSelectedProfile(profile)
        speak(`Profile found for ${profile.name}`)
      } else {
        speak("No matching profiles found")
      }
    }, 1500)
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-500" />
          OSINT Intelligence Dashboard
        </CardTitle>
        <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-500">
          <Shield className="h-3 w-3 mr-1" /> Intelligence
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or alias..."
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

        {selectedProfile ? (
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
                onClick={() => setActiveTab("leaks")}
                className={`px-3 py-1 ${
                  activeTab === "leaks" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Data Leaks
              </button>
              <button
                onClick={() => setActiveTab("aliases")}
                className={`px-3 py-1 ${
                  activeTab === "aliases"
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Aliases
              </button>
            </div>

            {activeTab === "profile" && (
              <div>
                <div className="mb-4 p-4 bg-dark-200 rounded-md">
                  <h3 className="text-xl font-bold mb-2">{selectedProfile.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedProfile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedProfile.location}</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-medium mb-2">Social Profiles</h4>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {selectedProfile.socialProfiles.map((profile, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-dark-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span>
                          {profile.platform}: {profile.username}
                        </span>
                      </div>
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "leaks" && (
              <div>
                <h4 className="font-medium mb-2">Data Breach History</h4>
                {selectedProfile.leaks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedProfile.leaks.map((leak, index) => (
                      <div key={index} className="p-3 bg-dark-200 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium">{leak.source}</div>
                          <Badge
                            className={`
                            ${leak.severity === "high" ? "bg-red-900/20 text-red-400 border-red-500" : ""}
                            ${leak.severity === "medium" ? "bg-yellow-900/20 text-yellow-400 border-yellow-500" : ""}
                            ${leak.severity === "low" ? "bg-green-900/20 text-green-400 border-green-500" : ""}
                          `}
                          >
                            {leak.severity === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {leak.severity.charAt(0).toUpperCase() + leak.severity.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400 mb-1">Date: {leak.date}</div>
                        <div className="text-sm">
                          <span className="text-gray-400">Compromised data:</span> {leak.dataType}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">No known data breaches</div>
                )}
              </div>
            )}

            {activeTab === "aliases" && (
              <div>
                <h4 className="font-medium mb-2">Known Aliases</h4>
                {selectedProfile.aliases.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.aliases.map((alias, index) => (
                      <Badge key={index} className="bg-dark-300 text-gray-300">
                        <User className="h-3 w-3 mr-1" />
                        {alias}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">No known aliases</div>
                )}
              </div>
            )}

            <button onClick={() => setSelectedProfile(null)} className="mt-4 text-sm text-blue-400 hover:text-blue-300">
              Back to search
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search className="h-12 w-12 mb-2 opacity-30" />
            <p>Search for a person by name, email, or alias</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
