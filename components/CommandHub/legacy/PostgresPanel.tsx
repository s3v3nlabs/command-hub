"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Table, Play, Download, Copy, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { speak } from "@/lib/audio"

interface TableSchema {
  name: string
  columns: {
    name: string
    type: string
    nullable: boolean
    isPrimary: boolean
    isForeign: boolean
  }[]
  rowCount: number
}

interface QueryResult {
  columns: string[]
  rows: any[][]
  executionTime: number
  affectedRows?: number
}

export default function PostgresPanel() {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;")
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const tables: TableSchema[] = [
    {
      name: "users",
      columns: [
        { name: "id", type: "uuid", nullable: false, isPrimary: true, isForeign: false },
        { name: "username", type: "varchar(50)", nullable: false, isPrimary: false, isForeign: false },
        { name: "email", type: "varchar(100)", nullable: false, isPrimary: false, isForeign: false },
        { name: "password_hash", type: "varchar(255)", nullable: false, isPrimary: false, isForeign: false },
        { name: "created_at", type: "timestamp", nullable: false, isPrimary: false, isForeign: false },
        { name: "last_login", type: "timestamp", nullable: true, isPrimary: false, isForeign: false },
      ],
      rowCount: 1250,
    },
    {
      name: "posts",
      columns: [
        { name: "id", type: "uuid", nullable: false, isPrimary: true, isForeign: false },
        { name: "user_id", type: "uuid", nullable: false, isPrimary: false, isForeign: true },
        { name: "title", type: "varchar(200)", nullable: false, isPrimary: false, isForeign: false },
        { name: "content", type: "text", nullable: false, isPrimary: false, isForeign: false },
        { name: "published", type: "boolean", nullable: false, isPrimary: false, isForeign: false },
        { name: "created_at", type: "timestamp", nullable: false, isPrimary: false, isForeign: false },
        { name: "updated_at", type: "timestamp", nullable: true, isPrimary: false, isForeign: false },
      ],
      rowCount: 3427,
    },
    {
      name: "comments",
      columns: [
        { name: "id", type: "uuid", nullable: false, isPrimary: true, isForeign: false },
        { name: "post_id", type: "uuid", nullable: false, isPrimary: false, isForeign: true },
        { name: "user_id", type: "uuid", nullable: false, isPrimary: false, isForeign: true },
        { name: "content", type: "text", nullable: false, isPrimary: false, isForeign: false },
        { name: "created_at", type: "timestamp", nullable: false, isPrimary: false, isForeign: false },
      ],
      rowCount: 8912,
    },
    {
      name: "categories",
      columns: [
        { name: "id", type: "uuid", nullable: false, isPrimary: true, isForeign: false },
        { name: "name", type: "varchar(50)", nullable: false, isPrimary: false, isForeign: false },
        { name: "description", type: "text", nullable: true, isPrimary: false, isForeign: false },
      ],
      rowCount: 12,
    },
    {
      name: "post_categories",
      columns: [
        { name: "post_id", type: "uuid", nullable: false, isPrimary: true, isForeign: true },
        { name: "category_id", type: "uuid", nullable: false, isPrimary: true, isForeign: true },
      ],
      rowCount: 4521,
    },
  ]

  const executeQuery = () => {
    if (!query.trim()) return

    setIsExecuting(true)
    speak("Executing query")

    // Simulate query execution delay
    setTimeout(() => {
      setIsExecuting(false)

      // Mock query results based on the query
      let result: QueryResult

      if (query.toLowerCase().includes("select") && query.toLowerCase().includes("from users")) {
        result = {
          columns: ["id", "username", "email", "created_at", "last_login"],
          rows: [
            [
              "550e8400-e29b-41d4-a716-446655440000",
              "admin",
              "admin@example.com",
              "2023-01-15 08:30:45",
              "2023-05-12 14:22:10",
            ],
            [
              "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
              "johndoe",
              "john.doe@example.com",
              "2023-01-20 12:45:33",
              "2023-05-10 09:15:22",
            ],
            [
              "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
              "janedoe",
              "jane.doe@example.com",
              "2023-01-22 15:10:27",
              "2023-05-11 16:40:05",
            ],
            [
              "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
              "bobsmith",
              "bob.smith@example.com",
              "2023-02-05 09:20:18",
              "2023-05-09 11:30:45",
            ],
            [
              "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
              "alicejones",
              "alice.jones@example.com",
              "2023-02-10 14:35:52",
              "2023-05-08 17:25:30",
            ],
          ],
          executionTime: 0.023,
        }
      } else if (query.toLowerCase().includes("select") && query.toLowerCase().includes("from posts")) {
        result = {
          columns: ["id", "user_id", "title", "published", "created_at"],
          rows: [
            [
              "7ba7b810-9dad-11d1-80b4-00c04fd430c8",
              "550e8400-e29b-41d4-a716-446655440000",
              "Welcome to our platform",
              true,
              "2023-02-15 10:30:45",
            ],
            [
              "7ba7b811-9dad-11d1-80b4-00c04fd430c8",
              "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
              "Getting started with PostgreSQL",
              true,
              "2023-02-20 14:45:33",
            ],
            [
              "7ba7b812-9dad-11d1-80b4-00c04fd430c8",
              "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
              "Advanced database techniques",
              false,
              "2023-03-05 09:20:18",
            ],
            [
              "7ba7b813-9dad-11d1-80b4-00c04fd430c8",
              "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
              "Security best practices",
              true,
              "2023-03-10 14:35:52",
            ],
          ],
          executionTime: 0.031,
        }
      } else if (
        query.toLowerCase().includes("insert") ||
        query.toLowerCase().includes("update") ||
        query.toLowerCase().includes("delete")
      ) {
        result = {
          columns: [],
          rows: [],
          executionTime: 0.018,
          affectedRows: 1,
        }
      } else {
        result = {
          columns: ["result"],
          rows: [["No data returned"]],
          executionTime: 0.015,
        }
      }

      setQueryResult(result)

      if (result.affectedRows) {
        speak(`Query executed successfully. ${result.affectedRows} rows affected.`)
      } else {
        speak(`Query executed successfully. Returned ${result.rows.length} rows.`)
      }
    }, 1000)
  }

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
    setQuery(`SELECT * FROM ${tableName} LIMIT 10;`)
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(query)
    speak("Query copied to clipboard")
  }

  const exportResults = () => {
    if (!queryResult) return

    speak("Exporting query results")
    // In a real app, this would generate a CSV file for download
    alert("Results exported (mock)")
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          PostgreSQL Explorer
        </CardTitle>
        {queryResult && (
          <button
            onClick={exportResults}
            className="text-gray-400 hover:text-white transition-colors"
            title="Export Results"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0 h-[500px] flex flex-col">
        <div className="flex h-full">
          <div className="w-1/4 border-r border-dark-300 overflow-y-auto">
            <div className="p-3 border-b border-dark-300 bg-dark-200">
              <h3 className="text-sm font-medium">Database Tables</h3>
            </div>
            {tables.map((table) => (
              <div
                key={table.name}
                className={`p-3 border-b border-dark-300 cursor-pointer hover:bg-dark-200 transition-colors ${
                  selectedTable === table.name ? "bg-dark-300" : ""
                }`}
                onClick={() => handleTableSelect(table.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Table className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{table.name}</span>
                  </div>
                  <Badge className="bg-dark-400 text-gray-300">{table.rowCount}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="w-3/4 flex flex-col">
            <div className="p-3 border-b border-dark-300 bg-dark-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">SQL Query</h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyQuery}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copy Query"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={executeQuery}
                    disabled={isExecuting}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Execute Query"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-24 bg-dark-300 border border-dark-400 rounded p-2 text-sm font-mono"
                spellCheck="false"
              />
            </div>

            <div className="flex-grow overflow-auto p-3">
              {isExecuting ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span>Executing query...</span>
                  </div>
                </div>
              ) : queryResult ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Query Results</h3>
                    <Badge className="bg-dark-300 text-gray-300">
                      {queryResult.affectedRows !== undefined
                        ? `${queryResult.affectedRows} rows affected`
                        : `${queryResult.rows.length} rows`}{" "}
                      • {queryResult.executionTime.toFixed(3)}s
                    </Badge>
                  </div>

                  {queryResult.columns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-dark-300">
                            {queryResult.columns.map((column, index) => (
                              <th key={index} className="border border-dark-400 p-2 text-left text-xs font-medium">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-dark-200" : "bg-dark-300"}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border border-dark-400 p-2 text-xs font-mono">
                                  {cell === null ? <span className="text-gray-500">NULL</span> : String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-dark-200 p-3 rounded">
                      <div className="text-green-400">Query executed successfully.</div>
                      <div>{queryResult.affectedRows} rows affected.</div>
                    </div>
                  )}
                </div>
              ) : selectedTable ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Table Schema: {selectedTable}</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-dark-300">
                        <th className="border border-dark-400 p-2 text-left text-xs font-medium">Column</th>
                        <th className="border border-dark-400 p-2 text-left text-xs font-medium">Type</th>
                        <th className="border border-dark-400 p-2 text-left text-xs font-medium">Nullable</th>
                        <th className="border border-dark-400 p-2 text-left text-xs font-medium">Constraints</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables
                        .find((t) => t.name === selectedTable)
                        ?.columns.map((column, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-dark-200" : "bg-dark-300"}>
                            <td className="border border-dark-400 p-2 text-xs font-mono">{column.name}</td>
                            <td className="border border-dark-400 p-2 text-xs font-mono">{column.type}</td>
                            <td className="border border-dark-400 p-2 text-xs">{column.nullable ? "YES" : "NO"}</td>
                            <td className="border border-dark-400 p-2 text-xs">
                              {column.isPrimary && (
                                <Badge className="bg-amber-900/20 text-amber-400 border-amber-500 mr-1">
                                  PRIMARY KEY
                                </Badge>
                              )}
                              {column.isForeign && (
                                <Badge className="bg-blue-900/20 text-blue-400 border-blue-500">FOREIGN KEY</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Database className="h-12 w-12 mb-2 opacity-30" />
                  <p>Select a table or write a custom query</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
