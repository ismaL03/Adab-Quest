import { useEffect, useMemo, useRef, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { SURAHS, WORDS, arNum, search, type Word } from './data'
import {
  counts,
  exportData,
  getState,
  importData,
  mark,
  markMany,
  nextNew,
  pickUnlock,
  reviewQueue,
  scopeLabel,
  setState,
  statusOf,
  useStore,
  type Pick,
  type Status,
  type UnlockMode,
} from './store'
import { Unlock, isAndroid, isNative } from './native'

// Version web : ouverte dans le navigateur (pas encore installée) ou depuis l'écran d'accueil.
const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
const isAndroidWeb = !isNative && /Android/.test(navigator.userAgent)
const wordLink = location.origin + location.pathname + '?mot=1'

type Overlay =
  | { t: 'session'; mode: 'new' | 'review'; mastered?: boolean }
  | { t: 'surah'; n: number }
  | { t: 'unlock'; pick: Pick }
  | { t: 'scope' }
  | { t: 'install' }
type Tab = 'home' | 'surahs' | 'settings'

const STATUS_LABEL = ['Nouveau', 'À réviser', 'Maîtrisé']

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [stack, setStack] = useState<Overlay[]>(() => {
    if (isNative) return []
    // Lien « ?mot=1 » (automatisation iPhone) : on ouvre directement sur un mot.
    if (new URLSearchParams(location.search).has('mot')) {
      const pick = pickUnlock()
      return pick ? [{ t: 'unlock', pick }] : []
    }
    // Première visite dans le navigateur : on explique comment installer.
    if (!standalone && !localStorage.getItem('siraj.installSeen')) return [{ t: 'install' }]
    return []
  })
  const push = (o: Overlay) => setStack((s) => [...s, o])
  const pop = () => setStack((s) => s.slice(0, -1))
  const top = stack[stack.length - 1]

  // Android : mot au déverrouillage + bouton retour.
  const nav = useRef({ tab, depth: stack.length })
  nav.current = { tab, depth: stack.length }
  useEffect(() => {
    if (!isAndroid) return
    const handles = [
      Unlock.addListener('unlock', () => {
        const pick = pickUnlock()
        if (pick) setStack((s) => [...s.filter((o) => o.t !== 'unlock'), { t: 'unlock', pick }])
      }),
      CapApp.addListener('backButton', () => {
        if (nav.current.depth) pop()
        else if (nav.current.tab !== 'home') setTab('home')
        else CapApp.minimizeApp()
      }),
    ]
    const { enabled, interval } = getState().unlock
    Unlock.setEnabled({ enabled, interval }).catch(() => {})
    return () => handles.forEach((h) => h.then((x) => x.remove()))
  }, [])

  return (
    <div className="app">
      <main className="screen">
        {tab === 'home' && <Home push={push} />}
        {tab === 'surahs' && <SurahList push={push} />}
        {tab === 'settings' && <Settings push={push} />}
      </main>
      <nav className="tabs">
        {(
          [
            ['home', 'Accueil', '◈'],
            ['surahs', 'Sourates', '☰'],
            ['settings', 'Réglages', '⚙'],
          ] as const
        ).map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <span className="ico">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      {top && (
        <div className="overlay" key={stack.length + top.t}>
          {top.t === 'session' && <Session mode={top.mode} mastered={top.mastered} close={pop} />}
          {top.t === 'surah' && <SurahView n={top.n} close={pop} />}
          {top.t === 'scope' && <ScopePicker close={pop} />}
          {top.t === 'install' && <Install close={pop} />}
          {top.t === 'unlock' && <UnlockCard pick={top.pick} close={pop} />}
        </div>
      )}
    </div>
  )
}

/* ---------- Accueil ---------- */

function Home({ push }: { push: (o: Overlay) => void }) {
  const s = useStore()
  const c = counts()
  const fresh = useMemo(() => nextNew(), [s])
  const pct = (n: number) => (100 * n) / c.total + '%'
  return (
    <div className="pad">
      <header className="hero">
        <div className="ar hero-title">السِّرَاجُ</div>
        <div className="hero-sub">فِي بَيَانِ غَرِيبِ القُرْآنِ</div>
      </header>

      <section className="panel">
        <div className="bar" aria-label="Progression">
          <i className="b-m" style={{ width: pct(c.mastered) }} />
          <i className="b-r" style={{ width: pct(c.review) }} />
        </div>
        <div className="stats">
          <div>
            <b className="c-m">{c.mastered}</b>
            <span>Maîtrisés</span>
          </div>
          <div>
            <b className="c-r">{c.review}</b>
            <span>À réviser</span>
          </div>
          <div>
            <b>{c.fresh}</b>
            <span>Nouveaux</span>
          </div>
        </div>
      </section>

      <button className="cta primary" disabled={!fresh} onClick={() => push({ t: 'session', mode: 'new' })}>
        <strong>Apprendre de nouveaux mots</strong>
        <small>
          {fresh ? `${scopeLabel(s)} · reprise à ${SURAHS[fresh.s].fr}` : `${scopeLabel(s)} · tout a été vu, māshā'Allāh`}
        </small>
      </button>
      <button className="cta" disabled={!c.review} onClick={() => push({ t: 'session', mode: 'review' })}>
        <strong>Réviser</strong>
        <small>{c.review ? `${c.review} mot${c.review > 1 ? 's' : ''} à réviser` : 'Aucun mot à réviser pour le moment'}</small>
      </button>
      {c.mastered > 0 && (
        <button className="cta" onClick={() => push({ t: 'session', mode: 'review', mastered: true })}>
          <strong>Consolider</strong>
          <small>Repasser aussi les {c.mastered} mots maîtrisés</small>
        </button>
      )}
      <button className="link" onClick={() => push({ t: 'scope' })}>
        Choisir les sourates à apprendre →
      </button>
    </div>
  )
}

/* ---------- Carte ---------- */

function Ref({ w }: { w: Word }) {
  return (
    <div className="ref">
      <span className="ar">{SURAHS[w.s].ar}</span>
      <span>
        {SURAHS[w.s].fr}
        {w.a ? ` · verset ${w.a}` : ''}
      </span>
    </div>
  )
}

function Flash({ word, kind, onAnswer }: { word: Word; kind: 'new' | 'review'; onAnswer: (s: Status) => void }) {
  const [shown, setShown] = useState(kind === 'new')
  return (
    <div className="flash">
      <div className="card" onClick={() => setShown(true)}>
        <span className={'chip ' + kind}>{kind === 'new' ? 'Nouveau mot' : 'Révision'}</span>
        <Ref w={word} />
        <div className="ar word">﴿{word.w}﴾</div>
        <div className="sep" />
        {shown ? <div className="ar meaning">{word.m}</div> : <div className="hint">Touchez pour voir le sens</div>}
      </div>
      {shown ? (
        <div className="answers">
          <button className="btn again" onClick={() => onAnswer(1)}>
            À revoir
          </button>
          <button className="btn ok" onClick={() => onAnswer(2)}>
            Maîtrisé
          </button>
        </div>
      ) : (
        <div className="answers">
          <button className="btn wide" onClick={() => setShown(true)}>
            Voir le sens
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- Session ---------- */

function Session({ mode, mastered, close }: { mode: 'new' | 'review'; mastered?: boolean; close: () => void }) {
  useStore()
  const queue = useMemo(() => (mode === 'review' ? reviewQueue(mastered) : []), [])
  const [i, setI] = useState(0)
  const [skip] = useState(() => new Set<number>())
  const [done, setDone] = useState({ ok: 0, again: 0 })
  const [, bump] = useState(0)
  const word = mode === 'new' ? nextNew(skip) : (queue[i] ?? null)

  const answer = (st: Status) => {
    if (!word) return
    skip.add(word.id)
    mark(word.id, st)
    setDone((d) => (st === 2 ? { ...d, ok: d.ok + 1 } : { ...d, again: d.again + 1 }))
    setI((n) => n + 1)
  }
  const title = mode === 'new' ? 'Nouveaux mots' : mastered ? 'Consolidation' : 'Révision'
  const total = done.ok + done.again

  return (
    <div className="sheet">
      <Top title={title} close={close} right={mode === 'review' ? `${Math.min(i + 1, queue.length)} / ${queue.length}` : `${total} vus`} />
      {word ? (
        <>
          <Flash key={word.id} word={word} kind={mode} onAnswer={answer} />
          <button
            className="link center"
            onClick={() => {
              skip.add(word.id)
              setI((n) => n + 1)
              bump((n) => n + 1)
            }}
          >
            Passer ce mot
          </button>
        </>
      ) : (
        <div className="done">
          <div className="ar done-ar">بَارَكَ اللهُ فِيكَ</div>
          <p>
            {total
              ? `Session terminée : ${done.ok} maîtrisé${done.ok > 1 ? 's' : ''}, ${done.again} à revoir.`
              : mode === 'new'
                ? 'Aucun nouveau mot dans les sourates choisies.'
                : 'Rien à réviser pour le moment.'}
          </p>
          <button className="btn wide" onClick={close}>
            Terminer
          </button>
        </div>
      )}
    </div>
  )
}

function Top({ title, close, right }: { title: string; close: () => void; right?: string }) {
  return (
    <div className="top">
      <button className="back" onClick={close} aria-label="Retour">
        ‹
      </button>
      <h2>{title}</h2>
      <span className="top-r">{right}</span>
    </div>
  )
}

/* ---------- Mot au déverrouillage ---------- */

function UnlockCard({ pick, close }: { pick: Pick; close: () => void }) {
  const leave = () => {
    close()
    Unlock.dismiss().catch(() => {})
  }
  return (
    <div className="sheet unlock">
      <div className="top">
        <h2>{isNative ? 'Mot du déverrouillage' : 'Mot du moment'}</h2>
        <button className="link" onClick={leave}>
          Passer
        </button>
      </div>
      <Flash
        word={pick.word}
        kind={pick.kind}
        onAnswer={(st) => {
          mark(pick.word.id, st)
          leave()
        }}
      />
      <button className="link center" onClick={close}>
        Ouvrir l'application
      </button>
    </div>
  )
}

/* ---------- Sourates ---------- */

function StatusDot({ id }: { id: number }) {
  const st = statusOf(id)
  return (
    <button
      className={'dot s' + st}
      title={STATUS_LABEL[st]}
      onClick={(e) => {
        e.stopPropagation()
        mark(id, ((st + 1) % 3) as Status)
      }}
    >
      {st === 2 ? '✓' : st === 1 ? '↻' : ''}
    </button>
  )
}

function Row({ w, hide, showRef }: { w: Word; hide?: boolean; showRef?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="row" onClick={() => setOpen(true)}>
      <StatusDot id={w.id} />
      <div className="row-main">
        <div className="ar row-w">
          {w.w}
          {w.a > 0 && <span className="ayah">{arNum(w.a)}</span>}
        </div>
        {hide && !open ? <div className="hint small">Touchez pour voir le sens</div> : <div className="ar row-m">{w.m}</div>}
        {showRef && (
          <div className="row-ref">
            {SURAHS[w.s].fr}
            {w.a ? ` · ${w.a}` : ''}
          </div>
        )}
      </div>
    </li>
  )
}

function SurahList({ push }: { push: (o: Overlay) => void }) {
  const s = useStore()
  const [q, setQ] = useState('')
  const results = useMemo(() => search(q), [q])
  return (
    <div className="pad">
      <h1>Sourates</h1>
      <input
        className="search"
        placeholder="Rechercher un mot, un sens, une sourate…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q.trim() ? (
        <ul className="rows">
          {results.length === 0 && <p className="muted">Aucun résultat.</p>}
          {results.map((w) => (
            <Row key={w.id} w={w} showRef />
          ))}
        </ul>
      ) : (
        <ul className="surahs">
          {SURAHS.map((su) => {
            const c = counts(su.ids, s)
            return (
              <li key={su.n} onClick={() => push({ t: 'surah', n: su.n })}>
                <span className="num">{su.n || '·'}</span>
                <div className="su-main">
                  <div className="su-fr">{su.fr}</div>
                  <div className="su-sub">
                    {c.mastered} / {c.total} maîtrisés{c.review ? ` · ${c.review} à réviser` : ''}
                  </div>
                  <div className="bar thin">
                    <i className="b-m" style={{ width: (100 * c.mastered) / c.total + '%' }} />
                    <i className="b-r" style={{ width: (100 * c.review) / c.total + '%' }} />
                  </div>
                </div>
                <span className="ar su-ar">{su.ar}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SurahView({ n, close }: { n: number; close: () => void }) {
  const s = useStore()
  const su = SURAHS[n]
  const [hide, setHide] = useState(false)
  const c = counts(su.ids, s)
  return (
    <div className="sheet">
      <Top title={su.fr} close={close} right={`${c.mastered} / ${c.total}`} />
      <div className="ar su-head">سُورَةُ {su.ar}</div>
      <div className="tools">
        <button className={'pill' + (hide ? ' on' : '')} onClick={() => setHide(!hide)}>
          {hide ? 'Afficher les sens' : 'Masquer les sens'}
        </button>
        <button className="pill" onClick={() => markMany(su.ids, 2)}>
          Tout maîtrisé
        </button>
        <button className="pill" onClick={() => markMany(su.ids, 0)}>
          Réinitialiser
        </button>
      </div>
      <p className="muted small">Touchez la pastille d'un mot pour changer son statut : nouveau → à réviser → maîtrisé.</p>
      <ul className="rows" key={String(hide)}>
        {su.ids.map((id) => (
          <Row key={id} w={WORDS[id]} hide={hide} />
        ))}
      </ul>
    </div>
  )
}

/* ---------- Choix des sourates ---------- */

function ScopePicker({ close }: { close: () => void }) {
  const s = useStore()
  const sel = new Set(s.scope ?? [])
  const set = (list: number[]) => setState({ scope: list.length ? [...list].sort((a, b) => a - b) : null })
  const toggle = (n: number) => {
    sel.has(n) ? sel.delete(n) : sel.add(n)
    set([...sel])
  }
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
  return (
    <div className="sheet">
      <Top title="Sourates à apprendre" close={close} right={scopeLabel(s)} />
      <p className="muted small">Les nouveaux mots sont proposés dans l'ordre du Mushaf, parmi les sourates cochées.</p>
      <div className="tools">
        <button className={'pill' + (!s.scope ? ' on' : '')} onClick={() => set([])}>
          Tout le Coran
        </button>
        <button className="pill" onClick={() => set(range(78, 114))}>
          Juz' ʿAmma
        </button>
        <button className="pill" onClick={() => set(range(67, 77))}>
          Juz' Tabārak
        </button>
      </div>
      <ul className="checks">
        {SURAHS.slice(1).map((su) => (
          <li key={su.n} onClick={() => toggle(su.n)}>
            <span className={'box' + (sel.has(su.n) ? ' on' : '')}>{sel.has(su.n) ? '✓' : ''}</span>
            <span className="num">{su.n}</span>
            <span className="su-fr">{su.fr}</span>
            <span className="ar su-ar">{su.ar}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Installation (version web) ---------- */

function Install({ close }: { close: () => void }) {
  const [tab, setTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android')
  const [copied, setCopied] = useState(false)
  const done = () => {
    try {
      localStorage.setItem('siraj.installSeen', '1')
    } catch {}
    close()
  }
  return (
    <div className="sheet">
      <Top title="Installer As-Siraj" close={done} />
      <Seg<'android' | 'ios'>
        value={tab}
        options={[
          ['android', 'Android'],
          ['ios', 'iPhone'],
        ]}
        onChange={setTab}
      />
      {tab === 'android' ? (
        <div className="guide">
          <p>L'application Android affiche un mot à chaque déverrouillage du téléphone.</p>
          <a className="btn wide" href="./as-siraj.apk" download>
            Télécharger l'application
          </a>
          <ol>
            <li>Ouvrez le fichier téléchargé <b>as-siraj.apk</b>.</li>
            <li>
              Android demande d'autoriser l'installation depuis votre navigateur : touchez <b>Paramètres</b>, activez
              l'autorisation, puis revenez et touchez <b>Installer</b>.
            </li>
            <li>
              Ouvrez As-Siraj, allez dans <b>Réglages</b> et activez <b>Afficher un mot à chaque déverrouillage</b>, puis
              donnez l'autorisation demandée.
            </li>
          </ol>
          <p className="muted small">
            Si les mots cessent d'apparaître après quelques jours, retirez As-Siraj de l'économie de batterie du téléphone
            (Paramètres → Applications → As-Siraj → Batterie → Sans restriction).
          </p>
          {!isAndroidWeb && <p className="muted small">Ouvrez cette page depuis un téléphone Android pour l'installer.</p>}
        </div>
      ) : (
        <div className="guide">
          <p>
            Sur iPhone, Apple ne permet pas d'afficher un mot au déverrouillage. Choisissez <b>une</b> des deux façons de faire
            (la progression n'est pas partagée entre les deux).
          </p>
          <h3>Avec rappel automatique (conseillé)</h3>
          <p>Un mot s'affiche chaque fois que vous ouvrez l'application de votre choix, par exemple WhatsApp.</p>
          <button
            className="btn wide"
            onClick={() => navigator.clipboard.writeText(wordLink).then(() => setCopied(true), () => setCopied(false))}
          >
            {copied ? 'Lien copié ✓' : '1. Copier le lien du mot'}
          </button>
          <p className="muted small link-text">{wordLink}</p>
          <ol start={2}>
            <li>
              Ouvrez l'app <b>Raccourcis</b>, onglet <b>Automatisation</b>, puis <b>+</b>.
            </li>
            <li>
              Choisissez <b>App</b>, sélectionnez WhatsApp (ou une autre), cochez <b>Est ouverte</b> et <b>Exécuter immédiatement</b>
              , puis <b>Suivant</b>.
            </li>
            <li>
              Dans la barre <b>Recherche</b> en bas de l'écran, tapez <b>URL</b> et choisissez l'action{' '}
              <b>Ouvrir des URL</b> (sur un iPhone plus ancien : <b>Nouvelle automatisation vierge</b> d'abord). Collez le
              lien à la place du mot « URL », puis validez avec <b>✓</b> ou <b>Terminé</b>.
            </li>
          </ol>
          <h3>Sans rappel</h3>
          <ol>
            <li>
              Dans <b>Safari</b>, touchez le bouton <b>Partager</b> puis <b>Sur l'écran d'accueil</b>.
            </li>
            <li>Ouvrez As-Siraj depuis son icône : elle fonctionne aussi hors connexion.</li>
          </ol>
        </div>
      )}
      <button className="link center" onClick={done}>
        Continuer dans le navigateur
      </button>
    </div>
  )
}

/* ---------- Réglages ---------- */

function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, label]) => (
        <button key={String(v)} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Settings({ push }: { push: (o: Overlay) => void }) {
  const s = useStore()
  const [perm, setPerm] = useState<{ overlay: boolean; notifications: boolean } | null>(null)
  const [backup, setBackup] = useState<'idle' | 'restore'>('idle')
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!isAndroid) return
    const refresh = () => Unlock.getStatus().then(setPerm).catch(() => {})
    refresh()
    const h = CapApp.addListener('appStateChange', (st) => st.isActive && refresh())
    return () => void h.then((x) => x.remove())
  }, [])

  const setUnlock = (patch: Partial<typeof s.unlock>) => {
    const unlock = { ...s.unlock, ...patch }
    setState({ unlock })
    if (!isAndroid) return
    Unlock.setEnabled({ enabled: unlock.enabled, interval: unlock.interval }).catch(() => {})
    if (unlock.enabled && perm && !perm.notifications) Unlock.requestNotifications().catch(() => {})
  }

  return (
    <div className="pad">
      <h1>Réglages</h1>

      <section className="panel">
        <h3>Mot au déverrouillage</h3>
        {isAndroid ? (
          <>
            <label className="switch">
              <span>Afficher un mot à chaque déverrouillage</span>
              <input type="checkbox" checked={s.unlock.enabled} onChange={(e) => setUnlock({ enabled: e.target.checked })} />
            </label>
            {s.unlock.enabled && perm && !perm.overlay && (
              <div className="warn">
                <p>
                  Android demande l'autorisation « Superposition aux autres applis » pour que le mot puisse s'afficher au
                  déverrouillage.
                </p>
                <button className="btn wide" onClick={() => Unlock.requestOverlay()}>
                  Donner l'autorisation
                </button>
              </div>
            )}
            {s.unlock.enabled && perm?.overlay && <p className="good">Actif : un mot s'affichera au prochain déverrouillage.</p>}
          </>
        ) : (
          <p className="muted">
            L'affichage automatique à chaque déverrouillage n'existe que dans l'application Android : iOS ne l'autorise à aucune
            application.
          </p>
        )}
        <div className="field">
          <span>Mots proposés</span>
          <Seg<UnlockMode>
            value={s.unlock.mode}
            options={[
              ['mix', 'Mixte'],
              ['new', 'Nouveaux'],
              ['review', 'Révision'],
            ]}
            onChange={(mode) => setUnlock({ mode })}
          />
        </div>
        <div className="field">
          <span>Fréquence</span>
          <Seg<number>
            value={s.unlock.interval}
            options={[
              [0, 'À chaque fois'],
              [15, '15 min'],
              [60, '1 h'],
            ]}
            onChange={(interval) => setUnlock({ interval })}
          />
        </div>
      </section>

      {!isNative && (
        <section className="panel">
          <h3>Installation</h3>
          <button className="line" onClick={() => push({ t: 'install' })}>
            <span>Installer sur mon téléphone</span>
            <span className="muted">›</span>
          </button>
        </section>
      )}

      <section className="panel">
        <h3>Apprentissage</h3>
        <button className="line" onClick={() => push({ t: 'scope' })}>
          <span>Sourates à apprendre</span>
          <span className="muted">{scopeLabel(s)} ›</span>
        </button>
      </section>

      <section className="panel">
        <h3>Sauvegarde</h3>
        <p className="muted small">Votre progression est enregistrée sur cet appareil. Copiez-la pour la garder ou la transférer.</p>
        <div className="tools">
          <button
            className="pill"
            onClick={async () => {
              const data = exportData()
              try {
                await navigator.clipboard.writeText(data)
                setMsg('Sauvegarde copiée dans le presse-papiers.')
              } catch {
                setText(data)
                setBackup('restore')
                setMsg('Copiez le texte ci-dessous.')
              }
            }}
          >
            Copier ma progression
          </button>
          <button className="pill" onClick={() => setBackup(backup === 'restore' ? 'idle' : 'restore')}>
            Restaurer
          </button>
        </div>
        {backup === 'restore' && (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Collez ici une sauvegarde…" rows={4} />
            <button
              className="btn wide"
              onClick={() => {
                const ok = importData(text)
                setMsg(ok ? 'Progression restaurée.' : "Ce texte n'est pas une sauvegarde valide.")
                if (ok) setBackup('idle')
              }}
            >
              Restaurer cette sauvegarde
            </button>
          </>
        )}
        {msg && <p className="good">{msg}</p>}
        <button
          className="link danger"
          onClick={() => {
            if (confirm('Effacer toute la progression ? Cette action est définitive.')) setState({ st: {} })
          }}
        >
          Effacer toute ma progression
        </button>
      </section>

      <p className="credit">
        Contenu : <span className="ar">السراج في بيان غريب القرآن</span> — د. محمد بن عبد العزيز الخضيري. {WORDS.length} mots.
      </p>
    </div>
  )
}
