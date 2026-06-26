import { useUI } from '@/store/ui'
import { Modal } from '@/components/ui/Modal'
import { Kbd } from '@/components/ui/Kbd'
import { SHORTCUT_GROUPS } from '@/app/shortcuts'

export function ShortcutsDialog() {
  const open = useUI((s) => s.shortcutsOpen)
  const close = useUI((s) => s.closeShortcuts)

  return (
    <Modal open={open} onClose={close} title="Keyboard shortcuts" size="md">
      <div className="grid gap-6 sm:grid-cols-2">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2.5">
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wide text-faint">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">{s.label}</span>
                  {s.chord ? (
                    <span className="flex items-center gap-1">
                      <Kbd keys={[s.keys[0]]} />
                      <span className="text-[0.625rem] text-faint">then</span>
                      <Kbd keys={[s.keys[1]]} />
                    </span>
                  ) : (
                    <Kbd keys={s.keys} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  )
}
