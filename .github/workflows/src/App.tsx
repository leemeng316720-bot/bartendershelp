import { useEffect, useState } from 'react'
import { Wine, NotebookPen, Sparkles, BarChart3, User } from 'lucide-react'
import { Toaster } from 'sonner'
import type { AppData, Drink } from '@/types'
import { loadData, saveData, uid } from '@/lib/store'
import Archive from '@/sections/Archive'
import DrinkDetail from '@/sections/DrinkDetail'
import QuickCapture from '@/sections/QuickCapture'
import NamingLab from '@/sections/NamingLab'
import Briefing from '@/sections/Briefing'
import Settings from '@/sections/Settings'
import { cn } from '@/lib/utils'

type Tab = 'archive' | 'capture' | 'naming' | 'briefing' | 'me'

const TABS: { key: Tab; label: string; icon: typeof Wine }[] = [
  { key: 'archive', label: '档案', icon: Wine },
  { key: 'capture', label: '速记', icon: NotebookPen },
  { key: 'naming', label: '命名', icon: Sparkles },
  { key: 'briefing', label: '简报', icon: BarChart3 },
  { key: 'me', label: '我的', icon: User },
]

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [tab, setTab] = useState<Tab>('archive')
  const [openDrinkId, setOpenDrinkId] = useState<string | null>(null)
  const [namingDrinkId, setNamingDrinkId] = useState<string | null>(null)

  useEffect(() => {
    saveData(data)
  }, [data])

  const updateDrink = (d: Drink) =>
    setData((prev) => ({ ...prev, drinks: prev.drinks.map((x) => (x.id === d.id ? d : x)) }))

  const addDrink = (d: Drink) => setData((prev) => ({ ...prev, drinks: [d, ...prev.drinks] }))

  const deleteDrink = (id: string) => {
    setData((prev) => ({ ...prev, drinks: prev.drinks.filter((x) => x.id !== id) }))
    setOpenDrinkId(null)
  }

  const addSeries = (name: string) => {
    const id = uid()
    setData((prev) => ({ ...prev, series: [...prev.series, { id, name, createdAt: Date.now() }] }))
    return id
  }

  const goNaming = (id: string) => {
    setNamingDrinkId(id)
    setOpenDrinkId(null)
    setTab('naming')
  }

  const openDrink = openDrinkId ? data.drinks.find((d) => d.id === openDrinkId) : null

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <Toaster theme="dark" position="top-center" richColors />
      <main className="flex-1">
        {openDrink ? (
          <DrinkDetail
            drink={openDrink}
            data={data}
            onBack={() => setOpenDrinkId(null)}
            onUpdate={updateDrink}
            onDelete={deleteDrink}
            onGoNaming={goNaming}
            onAddSeries={addSeries}
          />
        ) : tab === 'archive' ? (
          <Archive data={data} onOpen={setOpenDrinkId} />
        ) : tab === 'capture' ? (
          <QuickCapture
            data={data}
            onSave={(d) => {
              addDrink(d)
              setTab('archive')
            }}
          />
        ) : tab === 'naming' ? (
          <NamingLab
            data={data}
            selectedDrinkId={namingDrinkId}
            onSelectDrink={setNamingDrinkId}
            onUpdateDrink={updateDrink}
            onGoSettings={() => setTab('me')}
          />
        ) : tab === 'briefing' ? (
          <Briefing data={data} onGoSettings={() => setTab('me')} />
        ) : (
          <Settings
            data={data}
            onUpdatePrefs={(prefs) => setData((p) => ({ ...p, prefs }))}
            onUpdateAI={(ai) => setData((p) => ({ ...p, ai }))}
            onReset={() => {
              localStorage.removeItem('bartender-apprentice-v1')
              window.location.reload()
            }}
          />
        )}
      </main>

      {/* 底部导航 */}
      <nav className="safe-bottom fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key && !openDrink
            return (
              <button
                key={key}
                onClick={() => {
                  setOpenDrinkId(null)
                  setTab(key)
                }}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground/70',
                )}
              >
                <Icon className={cn('h-5 w-5', key === 'capture' && 'h-6 w-6')} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
