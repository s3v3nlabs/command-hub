"use client"

import { useState } from "react"
import { AlertTriangle, BarChart2, Check, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function TechIDCard() {
  const [activeTemplate, setActiveTemplate] = useState("datacorp")
  const [name, setName] = useState("DS4-1774822-5")
  const [serialNumber, setSerialNumber] = useState("17743-822-5")
  const [department, setDepartment] = useState("PROTOTYPE")
  const [clearanceLevel, setClearanceLevel] = useState("B3")
  const [showBarcode, setShowBarcode] = useState(true)
  const [showWarning, setShowWarning] = useState(true)
  const [cardColor, setCardColor] = useState("black")
  const [accentColor, setAccentColor] = useState("red")
  const [cardType, setCardType] = useState("ID")

  // Generate a random barcode pattern
  const generateBarcode = () => {
    const bars = []
    for (let i = 0; i < 30; i++) {
      const width = Math.floor(Math.random() * 3) + 1
      bars.push(
        <div key={i} className="bg-white" style={{ width: `${width}px`, height: "40px", marginRight: "1px" }}></div>,
      )
    }
    return bars
  }

  // Generate a random QR-like pattern
  const generateQRPattern = () => {
    const cells = []
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (Math.random() > 0.5) {
          cells.push(
            <div
              key={`${i}-${j}`}
              className="bg-white"
              style={{
                width: "4px",
                height: "4px",
                position: "absolute",
                top: `${i * 6}px`,
                left: `${j * 6}px`,
              }}
            ></div>,
          )
        }
      }
    }
    return cells
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <header className="border-b border-zinc-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold tracking-tighter">TECH ID GENERATOR</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="text-white border-zinc-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto grid md:grid-cols-2 gap-8 p-4 md:p-8">
        <div className="space-y-6">
          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-white text-lg font-medium mb-4">Card Configuration</h2>

            <Tabs defaultValue="template" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${activeTemplate === "datacorp" ? "border-white" : "border-zinc-700"}`}
                    onClick={() => setActiveTemplate("datacorp")}
                  >
                    <div className="bg-black rounded-lg p-4 h-24 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-1/6 flex flex-col justify-center items-center">
                        <div className="writing-vertical text-xs text-white opacity-70">S/N 49-1508</div>
                      </div>
                      <div className="text-white text-xl font-bold">DATACORP</div>
                    </div>
                    <div className="text-white text-center mt-2 text-sm">Datacorp ID</div>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${activeTemplate === "prototype" ? "border-white" : "border-zinc-700"}`}
                    onClick={() => setActiveTemplate("prototype")}
                  >
                    <div className="bg-black rounded-lg p-4 h-24 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-white text-black text-xs p-1 px-3 rounded-bl-lg">
                        PROTOTYPE
                      </div>
                      <div className="text-white text-xl font-bold">SUPER-CAPACITOR</div>
                    </div>
                    <div className="text-white text-center mt-2 text-sm">Tech Component</div>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${activeTemplate === "caution" ? "border-white" : "border-zinc-700"}`}
                    onClick={() => setActiveTemplate("caution")}
                  >
                    <div className="bg-orange-600 rounded-lg p-4 h-24 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-2 left-2 text-black text-2xl font-bold">12v</div>
                      <div className="text-black text-lg font-bold ml-8">CAUTION</div>
                    </div>
                    <div className="text-white text-center mt-2 text-sm">Warning Label</div>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${activeTemplate === "service" ? "border-white" : "border-zinc-700"}`}
                    onClick={() => setActiveTemplate("service")}
                  >
                    <div className="bg-black rounded-lg p-4 h-24 flex items-center justify-center relative overflow-hidden">
                      <div className="text-white text-lg font-bold">NEXT SERVICE DUE</div>
                    </div>
                    <div className="text-white text-center mt-2 text-sm">Service Tag</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-white">
                      ID/Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="serial" className="text-white">
                      Serial Number
                    </Label>
                    <Input
                      id="serial"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="department" className="text-white">
                      Department/Type
                    </Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="clearance" className="text-white">
                      Clearance Level
                    </Label>
                    <Select value={clearanceLevel} onValueChange={setClearanceLevel}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue placeholder="Select clearance level" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="A1">A1 (Highest)</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                        <SelectItem value="B3">B3</SelectItem>
                        <SelectItem value="C4">C4</SelectItem>
                        <SelectItem value="D5">D5 (Lowest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cardType" className="text-white">
                      Card Type
                    </Label>
                    <Select value={cardType} onValueChange={setCardType}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="ID">ID Card</SelectItem>
                        <SelectItem value="ACCESS">Access Card</SelectItem>
                        <SelectItem value="COMPONENT">Component Label</SelectItem>
                        <SelectItem value="WARNING">Warning Label</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cardColor" className="text-white">
                      Card Color
                    </Label>
                    <Select value={cardColor} onValueChange={setCardColor}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue placeholder="Select card color" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="black">Black</SelectItem>
                        <SelectItem value="gray">Gray</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accentColor" className="text-white">
                      Accent Color
                    </Label>
                    <Select value={accentColor} onValueChange={setAccentColor}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue placeholder="Select accent color" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBarcode" className="text-white">
                      Show Barcode
                    </Label>
                    <Switch id="showBarcode" checked={showBarcode} onCheckedChange={setShowBarcode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showWarning" className="text-white">
                      Show Warning
                    </Label>
                    <Switch id="showWarning" checked={showWarning} onCheckedChange={setShowWarning} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-white text-lg font-medium mb-4">Design Elements</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-zinc-700 rounded-lg p-4">
                <h3 className="text-white text-sm font-medium mb-2">Typography</h3>
                <div className="space-y-2">
                  <div className="text-white text-2xl font-bold">TRUMP GOTHIC</div>
                  <div className="text-white text-sm">SYSTEM FONT</div>
                  <div className="text-white text-xs opacity-70">SECONDARY TEXT</div>
                </div>
              </div>

              <div className="border border-zinc-700 rounded-lg p-4">
                <h3 className="text-white text-sm font-medium mb-2">Colors</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-8 bg-black border border-zinc-700"></div>
                  <div className="h-8 bg-white"></div>
                  <div className="h-8 bg-red-600"></div>
                  <div className="h-8 bg-yellow-400"></div>
                </div>
              </div>

              <div className="border border-zinc-700 rounded-lg p-4">
                <h3 className="text-white text-sm font-medium mb-2">Icons</h3>
                <div className="flex space-x-3 text-white">
                  <AlertTriangle className="w-5 h-5" />
                  <BarChart2 className="w-5 h-5" />
                  <Check className="w-5 h-5" />
                  <X className="w-5 h-5" />
                </div>
              </div>

              <div className="border border-zinc-700 rounded-lg p-4">
                <h3 className="text-white text-sm font-medium mb-2">Patterns</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 border border-zinc-700 flex items-center justify-center">
                    <div className="w-full flex">{generateBarcode().slice(0, 8)}</div>
                  </div>
                  <div className="h-8 border border-zinc-700 flex items-center justify-center">
                    <div className="relative w-6 h-6">{generateQRPattern()}</div>
                  </div>
                  <div className="h-8 border border-zinc-700 flex items-center justify-center">
                    <div className="w-1 h-6 bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-white text-lg font-medium mb-4">Preview</h2>
            <div className="flex justify-center">
              {activeTemplate === "datacorp" && (
                <div
                  className={`bg-${cardColor === "black" ? "black" : cardColor === "white" ? "white" : cardColor === "gray" ? "zinc-700" : cardColor === "red" ? "red-600" : "black"} rounded-lg overflow-hidden w-full max-w-md aspect-[3/1] relative`}
                >
                  <div className="absolute left-0 top-0 h-full w-1/6 flex flex-col justify-center items-center border-r border-zinc-700">
                    <div className="writing-vertical text-xs text-white opacity-70">S/N 49-1508</div>
                    <div className="writing-vertical text-xs text-white opacity-70 mt-4">人工知能搭載</div>
                  </div>

                  <div className="absolute left-[16.67%] top-0 right-0 p-4">
                    <div className="flex justify-between items-start">
                      <div className={`text-${cardColor === "white" ? "black" : "white"} text-2xl font-bold`}>
                        DATACORP
                      </div>
                      <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs`}>{serialNumber}</div>
                    </div>

                    <div className="mt-2 flex">
                      <div className="w-16 h-16 border border-zinc-700 mr-4 flex items-center justify-center">
                        <div className="w-10 h-10 relative">{generateQRPattern()}</div>
                      </div>

                      <div className="flex-1">
                        <div className={`text-${cardColor === "white" ? "black" : "white"} text-sm`}>{name}</div>
                        <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs opacity-70 mt-1`}>
                          PROTOCOL DRIVER X.199
                        </div>

                        {showBarcode && <div className="mt-2 flex">{generateBarcode()}</div>}
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2">
                      <div className={`text-${accentColor} text-xs font-bold`}>{clearanceLevel}</div>
                    </div>
                  </div>

                  {showWarning && (
                    <div
                      className={`absolute bottom-0 left-[16.67%] bg-${accentColor} text-${accentColor === "white" || accentColor === "yellow" ? "black" : "white"} text-xs px-2 py-1`}
                    >
                      {department}
                    </div>
                  )}
                </div>
              )}

              {activeTemplate === "prototype" && (
                <div
                  className={`bg-${cardColor === "black" ? "black" : cardColor === "white" ? "white" : cardColor === "gray" ? "zinc-700" : cardColor === "red" ? "red-600" : "black"} rounded-lg overflow-hidden w-full max-w-md aspect-[3/1] relative border border-zinc-700`}
                >
                  <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 border-b border-zinc-700">
                    <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs`}>SUPER-CAPACITOR</div>
                    <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs`}>{serialNumber}</div>
                  </div>

                  <div className="absolute top-8 right-0 bg-white text-black text-xs p-1 px-3 rounded-bl-lg">
                    <div className={`text-black flex items-center`}>
                      <div className={`w-2 h-2 rounded-full bg-${accentColor} mr-1`}></div>
                      {department}
                    </div>
                  </div>

                  <div className="absolute top-16 left-4 right-4 bottom-4 flex">
                    <div className="w-1/3 border-r border-zinc-700 flex items-center justify-center">
                      <div className="relative w-16 h-16 border border-zinc-700 rounded-full flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs`}>RESCUE</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-1/3 border-r border-zinc-700 flex items-center justify-center">
                      <div className="w-16 h-16 border border-zinc-700 flex items-center justify-center">
                        <div className="w-8 h-8">
                          <div className={`text-${cardColor === "white" ? "black" : "white"} text-3xl font-bold`}>
                            *
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-1/3 p-2">
                      <div className={`text-${cardColor === "white" ? "black" : "white"} text-[8px] leading-tight`}>
                        DEVICE USED TO STORE AN ELECTRIC CHARGE, CONSISTING OF ONE OR MORE PAIRS OF CONDUCTORS SEPARATED
                        BY AN INSULATOR.
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-1 left-4 text-[8px] text-zinc-500">Ψ = 0 driver</div>
                </div>
              )}

              {activeTemplate === "caution" && (
                <div className={`bg-orange-600 rounded-lg overflow-hidden w-full max-w-md aspect-[3/1] relative`}>
                  <div className="absolute top-2 left-2 bottom-2 w-16 bg-black flex items-center justify-center">
                    <div className="text-white text-2xl font-bold">12v</div>
                  </div>

                  <div className="absolute top-2 left-20 right-2">
                    <div className="flex items-center">
                      <div className="text-black text-xl font-bold mr-2">CAUTION</div>
                      <div className="text-black">⚡</div>
                    </div>

                    <div className="mt-2 text-black text-[8px] leading-tight max-w-xs">
                      DO NOT TOUCH A PERSON OR ELECTRICAL APPARATUS IN THE EVENT OF AN ELECTRICAL INCIDENT. ALWAYS
                      DISCONNECT THE POWER SOURCE FIRST.
                    </div>
                  </div>

                  {showBarcode && (
                    <div className="absolute bottom-2 right-2 flex h-6">{generateBarcode().slice(0, 15)}</div>
                  )}
                </div>
              )}

              {activeTemplate === "service" && (
                <div
                  className={`bg-${cardColor === "black" ? "black" : cardColor === "white" ? "white" : cardColor === "gray" ? "zinc-700" : cardColor === "red" ? "red-600" : "black"} rounded-lg overflow-hidden w-full max-w-md aspect-[3/1] relative border border-zinc-700`}
                >
                  <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-4 border-b border-zinc-700">
                    <div className={`text-${cardColor === "white" ? "black" : "white"} text-sm font-bold`}>
                      NEXT SERVICE DUE
                    </div>
                  </div>

                  <div className="absolute top-10 left-4 right-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs mb-1`}>DATE:</div>
                      <div className={`h-6 border border-${cardColor === "white" ? "black" : "white"} rounded`}></div>
                    </div>

                    <div>
                      <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs mb-1`}>KM/MILES:</div>
                      <div className={`h-6 border border-${cardColor === "white" ? "black" : "white"} rounded`}></div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className={`text-${cardColor === "white" ? "black" : "white"} text-xs mb-1`}>OIL GRADE:</div>
                    <div className={`h-6 border border-${cardColor === "white" ? "black" : "white"} rounded`}></div>
                  </div>

                  <div className="absolute top-0 right-0 bottom-0 w-6 bg-zinc-800 flex flex-col items-center justify-center">
                    <div className="writing-vertical text-xs text-white">CONTROL UNIT</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-white text-lg font-medium mb-4">Additional Cards</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black rounded-lg p-4 aspect-[3/1] flex items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
                <div className="text-white text-lg font-bold">B17X</div>
                <div className="absolute bottom-1 left-2 text-green-500 text-xs">SYNTHESIS PORT B3</div>
                <div className="absolute top-2 right-2 text-white text-xs">EE/3.44.2 PL-M</div>
              </div>

              <div className="bg-black rounded-lg p-4 aspect-[3/1] flex items-center justify-center relative overflow-hidden">
                <div className="text-white text-xl font-bold">M45</div>
                <div className="absolute top-1 right-1 text-white text-xs">SUPERCHARGER</div>
                <div className="absolute bottom-1 left-1 text-yellow-400 text-xs flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  <span>WARNING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
