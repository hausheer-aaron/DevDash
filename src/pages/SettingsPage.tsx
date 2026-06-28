import { useRef, useState, type ReactNode } from 'react'
import {
  Palette,
  Monitor,
  Download,
  Upload,
  Trash2,
  Database,
  Sparkles,
  Github,
  User,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react'
import type { ExportBundle, ThemeMode } from '@/types'
import { useStore } from '@/store/store'
import { useAuthStore } from '@/store/auth'
import { useConfirm } from '@/components/ui/Confirm'
import { useToast } from '@/components/ui/Toast'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Modal } from '@/components/ui/Modal'
import { ACCENT_KEYS, ACCENT_SWATCHES } from '@/lib/constants'
import { bundleSummary, parseBundle, readFileAsText } from '@/lib/io'
import { cn, downloadJson } from '@/lib/utils'

export function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const exportBundle = useStore((s) => s.exportBundle)
  const importBundle = useStore((s) => s.importBundle)
  const resetAll = useStore((s) => s.resetAll)
  const loadSeed = useStore((s) => s.loadSeed)
  const counts = useStore((s) => ({
    projects: s.projects.length,
    tasks: s.tasks.length,
    notes: s.notes.length,
    snippets: s.snippets.length,
    commands: s.commands.length,
    links: s.links.length,
    resources: s.resources.length,
  }))
  const auth = useAuthStore((s) => ({
    mode: s.mode,
    configured: s.configured,
    loading: s.loading,
    userEmail: s.userEmail,
    notice: s.notice,
    error: s.error,
    signIn: s.signIn,
    signUp: s.signUp,
    signOut: s.signOut,
  }))
  const confirm = useConfirm()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<ExportBundle | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn')
  const [formError, setFormError] = useState<string | null>(null)

  const onExport = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJson(`devdash-export-${stamp}.json`, exportBundle())
    toast.success('Export downloaded')
  }

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await readFileAsText(file)
      setPending(parseBundle(text))
    } catch (e) {
      toast.error('Import failed', e instanceof Error ? e.message : 'Unknown error')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const doImport = async (mode: 'merge' | 'replace') => {
    if (!pending) return
    try {
      if (mode === 'replace') {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-')
        downloadJson(`devdash-backup-before-import-${stamp}.json`, exportBundle())
      }
      const result = await importBundle(pending, mode)
      setPending(null)
      const repaired = result.repaired.length ? `${result.repaired.length} repairs applied.` : undefined
      toast.success(mode === 'replace' ? 'Data replaced' : 'Data merged', repaired)
    } catch (e) {
      toast.error('Import failed', e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const onReset = async () => {
    const ok = await confirm({
      title: 'Erase all data?',
      description:
        'Every project, task, note, snippet, command, link and resource will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Erase everything',
      destructive: true,
    })
    if (ok) {
      await resetAll()
      toast.success('All data erased')
    }
  }

  const onLoadSeed = async () => {
    const ok = await confirm({
      title: 'Load sample data?',
      description: 'This replaces your current data with a demo workspace.',
      confirmLabel: 'Load sample data',
      destructive: true,
    })
    if (ok) {
      await loadSeed()
      toast.success('Sample data loaded')
    }
  }

  const validateAuthForm = (
    emailValue: string,
    passwordValue: string,
    confirmPasswordValue: string,
    mode: 'signIn' | 'signUp',
  ) => {
    const normalizedEmail = emailValue.trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) return 'Enter a valid email address.'
    if (passwordValue.length < 6) return 'Password must be at least 6 characters.'
    if (mode === 'signUp' && passwordValue !== confirmPasswordValue) return 'Passwords do not match.'
    return null
  }

  const onSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateAuthForm(email, password, confirmPassword, authMode)
    if (validationError) {
      setFormError(validationError)
      return
    }
    try {
      setFormError(null)
      if (authMode === 'signUp') {
        await auth.signUp(email, password)
        toast.success('Account created')
      } else {
        await auth.signIn(email, password)
        toast.success('Signed in')
      }
    } catch (error) {
      toast.error('Sign in failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const onSignOut = async () => {
    try {
      await auth.signOut()
      toast.success('Signed out')
    } catch (error) {
      toast.error('Sign out failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const authButtonDisabled = auth.loading

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Personalize DevDash and manage your data." />

      <div className="mt-8 space-y-8">
        {/* Appearance */}
        <Section icon={Palette} title="Appearance" description="Theme and accent color.">
          <SettingRow label="Theme" hint="Choose how DevDash looks.">
            <SegmentedControl
              value={settings.theme}
              onChange={(v) => updateSettings({ theme: v as ThemeMode })}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'system', label: 'System' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Accent color" hint="Used across buttons, links and highlights.">
            <div className="flex flex-wrap gap-2">
              {ACCENT_KEYS.map((c) => {
                const swatch = ACCENT_SWATCHES[c]
                return (
                  <button
                    key={c}
                    onClick={() => updateSettings({ accent: c })}
                    title={swatch.label}
                    className={cn(
                      'h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-bg transition',
                      settings.accent === c ? 'ring-fg/60 scale-110' : 'ring-transparent hover:scale-105',
                    )}
                    style={{ backgroundImage: `linear-gradient(135deg, ${swatch.from}, ${swatch.to})` }}
                  />
                )
              })}
            </div>
          </SettingRow>
          <SettingRow label="Reduce motion" hint="Minimize animations and transitions.">
            <Switch
              checked={settings.reduceMotion}
              onChange={(v) => updateSettings({ reduceMotion: v })}
              aria-label="Reduce motion"
            />
          </SettingRow>
        </Section>

        {/* Behavior */}
        <Section icon={Monitor} title="Behavior" description="Defaults and preferences.">
          <SettingRow label="Default view" hint="Where the app opens on launch.">
            <SegmentedControl
              value={settings.defaultView}
              onChange={(v) => updateSettings({ defaultView: v as 'dashboard' | 'projects' })}
              options={[
                { value: 'dashboard', label: 'Dashboard' },
                { value: 'projects', label: 'Projects' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Show completed tasks" hint="Show the Done column on Kanban boards.">
            <Switch
              checked={settings.showCompletedTasks}
              onChange={(v) => updateSettings({ showCompletedTasks: v })}
              aria-label="Show completed tasks"
            />
          </SettingRow>
        </Section>

        {/* Account */}
        <Section
          icon={User}
          title="Account"
          description={auth.configured ? 'Supabase authentication.' : 'Local-only mode.'}
        >
          <div className="rounded-xl border border-border bg-surface/40 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-fg">
                  {auth.mode === 'signed_in'
                    ? auth.userEmail ?? 'Signed in'
                    : auth.configured
                      ? 'Not signed in'
                      : 'Local-only mode'}
                </p>
                <p className="mt-0.5 text-xs text-faint">
                  {auth.mode === 'signed_in'
                    ? 'Cloud account connected. Project data still stays local for now.'
                    : auth.configured
                      ? 'Sign in or create an account with email and password. Project data stays local for now.'
                      : 'Supabase is not configured. DevDash remains fully local.'}
                </p>
              </div>
              {auth.mode === 'signed_in' && (
                <Button variant="secondary" onClick={onSignOut} disabled={auth.loading}>
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              )}
            </div>

            {auth.configured && auth.mode !== 'signed_in' && (
              <div className="mt-4 space-y-3">
                <SegmentedControl
                  value={authMode}
                  onChange={(v) => {
                    setAuthMode(v as 'signIn' | 'signUp')
                    setFormError(null)
                  }}
                  options={[
                    { value: 'signIn', label: 'Sign in' },
                    { value: 'signUp', label: 'Create account' },
                  ]}
                />
                <form onSubmit={onSubmitAuth} className="space-y-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="min-h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none transition placeholder:text-faint focus:border-accent"
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    className="min-h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none transition placeholder:text-faint focus:border-accent"
                  />
                  {authMode === 'signUp' && (
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm password"
                      className="min-h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none transition placeholder:text-faint focus:border-accent"
                    />
                  )}
                  <Button variant="primary" disabled={authButtonDisabled}>
                    {authMode === 'signUp' ? (
                      <UserPlus className="h-4 w-4" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    {authMode === 'signUp' ? 'Create account' : 'Sign in'}
                  </Button>
                </form>
              </div>
            )}

            {auth.notice && <p className="mt-3 text-xs text-muted">{auth.notice}</p>}
            {auth.error && <p className="mt-3 text-xs text-danger">{auth.error}</p>}
            {formError && <p className="mt-3 text-xs text-danger">{formError}</p>}
          </div>
        </Section>

        {/* Data */}
        <Section icon={Database} title="Data" description="Everything is stored locally in your browser.">
          <div className="grid gap-2 rounded-xl border border-border bg-surface/40 p-3 sm:grid-cols-4">
            <Stat label="Projects" value={counts.projects} />
            <Stat label="Tasks" value={counts.tasks} />
            <Stat label="Notes" value={counts.notes} />
            <Stat label="Snippets" value={counts.snippets} />
            <Stat label="Commands" value={counts.commands} />
            <Stat label="Links" value={counts.links} />
            <Stat label="Resources" value={counts.resources} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onExport}>
              <Download className="h-4 w-4" /> Export JSON
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
            <Button variant="secondary" onClick={onLoadSeed}>
              <Sparkles className="h-4 w-4" /> Load sample data
            </Button>
            <Button variant="danger" onClick={onReset}>
              <Trash2 className="h-4 w-4" /> Erase all data
            </Button>
          </div>
        </Section>

        {/* About */}
        <Section icon={Github} title="About" description="DevDash — your developer workspace.">
          <p className="text-sm leading-relaxed text-muted">
            DevDash keeps everything about your software projects in one fast, local-first place:
            tasks, notes, snippets, commands, links and resources. Built with React, TypeScript,
            Tailwind and Zustand. Your data never leaves your browser.
          </p>
          <p className="mt-3 text-xs text-faint">Version 1.0.0</p>
        </Section>
      </div>

      {/* Import confirmation */}
      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Import data"
        description="Choose how to apply the imported file."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => doImport('merge')}>
              Merge
            </Button>
            <Button variant="primary" onClick={() => doImport('replace')}>
              Replace all
            </Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-3">
            <p className="text-sm text-muted">This file contains:</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface/40 p-3 sm:grid-cols-4">
              {Object.entries(bundleSummary(pending)).map(([k, v]) => (
                <Stat key={k} label={k} value={v} />
              ))}
            </div>
            <p className="text-xs text-faint">
              <strong className="text-muted">Merge</strong> keeps your existing data and adds/updates
              from the file. <strong className="text-muted">Replace all</strong> discards your current
              data first.
            </p>
          </div>
        )}
      </Modal>
    </PageContainer>
  )
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Palette
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description && <p className="text-xs text-faint">{description}</p>}
        </div>
      </div>
      <div className="space-y-1 rounded-2xl border border-border bg-surface/30 p-2">{children}</div>
    </section>
  )
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl px-3 py-3 transition hover:bg-surface-hover/50 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-fg">{label}</p>
        {hint && <p className="text-xs text-faint">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-fg">{value}</div>
      <div className="text-[0.6875rem] capitalize text-faint">{label}</div>
    </div>
  )
}
