import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"

import { cn } from "../../lib/utils"

interface CommandItem {
  id: string
  title: string
  group: "Pages" | "Actions"
  onSelect: () => void
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const navigate = useNavigate()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    const openEvent = () => setOpen(true)
    
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("open-command-palette", openEvent)
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("open-command-palette", openEvent)
    }
  }, [])

  const items: CommandItem[] = React.useMemo(() => [
    { id: "dashboard", title: "Dashboard", group: "Pages", onSelect: () => navigate("/") },
    { id: "live", title: "Live Requests", group: "Pages", onSelect: () => navigate("/live") },
    { id: "analytics", title: "Analytics", group: "Pages", onSelect: () => navigate("/analytics") },
    { id: "models", title: "Models", group: "Pages", onSelect: () => navigate("/models") },
    { id: "providers", title: "Providers", group: "Pages", onSelect: () => navigate("/providers") },
    { id: "routing", title: "Router", group: "Pages", onSelect: () => navigate("/routing") },
    { id: "mcp", title: "MCP Servers", group: "Pages", onSelect: () => navigate("/mcp") },
    { id: "agents", title: "Agents", group: "Pages", onSelect: () => navigate("/agents") },
    { id: "users", title: "Users", group: "Pages", onSelect: () => navigate("/users") },
    { id: "settings", title: "Settings", group: "Pages", onSelect: () => navigate("/settings") },
    { id: "copy-url", title: "Copy Current URL", group: "Actions", onSelect: () => navigator.clipboard.writeText(window.location.href) },
  ], [navigate])

  const filteredItems = React.useMemo(() => {
    return items.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [items, search])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = filteredItems[selectedIndex]
        if (selected) {
          selected.onSelect()
          setOpen(false)
          setSearch("")
        }
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, filteredItems, selectedIndex])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center border-b border-border px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  autoFocus
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Type a command or search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {filteredItems.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No results found.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {["Pages", "Actions"].map((groupName) => {
                      const groupItems = filteredItems.filter((i) => i.group === groupName)
                      if (groupItems.length === 0) return null
                      
                      return (
                        <div key={groupName}>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {groupName}
                          </div>
                          {groupItems.map((item) => {
                            const globalIndex = filteredItems.findIndex((i) => i.id === item.id)
                            const isSelected = selectedIndex === globalIndex
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  item.onSelect()
                                  setOpen(false)
                                  setSearch("")
                                }}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={cn(
                                  "flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none",
                                  isSelected ? "bg-accent text-accent-foreground" : ""
                                )}
                              >
                                {item.title}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
