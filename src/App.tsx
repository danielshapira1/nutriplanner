import React, { useEffect, useMemo, useState } from 'react';
import type {
  PersistShape,
  MealEntry,
  Targets,
  DayKey,
  MealType,
  TabKey,
  WeeklyPlan,
} from './types';

import { toDateISO, sundayOfWeek } from './lib/dates';
import { loadState, saveState, getDailyQuote } from './lib/persist';
import { getOrCreatePlan, setPlanText } from './lib/planner';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TargetEditor from './components/TargetEditor';
import PlannerGrid from './components/PlannerGrid';
import SideSheet from './components/SideSheet';
import ConfirmModal from './components/ConfirmModal';
import WeightLog from './components/WeightLog';
import DayMeals from './components/DayMeals';
import Bubble from './components/Bubble';
import MonthPicker from './components/MonthPicker';

// ---- תוויות עברית לימי השבוע ולסוגי ארוחה (לכותרות בבועה) ----
const dayHeb: Record<DayKey, string> = {
  sun: 'א׳',
  mon: 'ב׳',
  tue: 'ג׳',
  wed: 'ד׳',
  thu: 'ה׳',
  fri: 'ו׳',
  sat: 'ש׳',
};
const slotHeb: Record<MealType, string> = {
  breakfast: 'בוקר',
  lunch: 'צהריים',
  snack1: 'ביניים',
  snack2: 'ביניים 2',
  dinner: 'ערב',
};

type BubbleState = { d: DayKey; slot: MealType; text: string } | null;

// ---- עזרי חישוב ----
function getTotalsForDate(state: PersistShape, dateISO: string) {
  const list = state.meals.filter((m) => m.dateISO === dateISO);
  const calories = list.reduce((s, m) => s + (Number(m.calories) || 0), 0);
  const protein = list.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  return { calories, protein };
}

function fmtRange(weekStartISO: string) {
  const start = new Date(weekStartISO);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const f = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${f(start)}-${f(end)}`;
}

// ======================================================================

export default function App(): JSX.Element {
  // טעינת מצב מהתקן מקומי
  const [state, setState] = useState<PersistShape>(() => loadState());
  useEffect(() => saveState(state), [state]);

  // טאבים וניהול תאריכים
  const [tab, setTab] = useState<TabKey>('home');
  const [dateISO, setDateISO] = useState<string>(toDateISO(new Date()));
  const weekStartISO = toDateISO(sundayOfWeek(new Date(dateISO)));

  // דפדוף צד (רשימת קניות)
  const [sheetOpen, setSheetOpen] = useState(false);

  // בועה לעריכת תא בפלנר
  const [bubble, setBubble] = useState<BubbleState>(null);

  // היסטוריה – פתיחת שבוע מסוים
  const [editingWeek, setEditingWeek] = useState<string | null>(null);

  // שחזור תכנון משבוע היסטורי
  const [restore, setRestore] = useState<{ open: boolean; from?: string }>({
    open: false,
  });

  // יעדים יומיים: אם אין ליום הזה, ננסה ברירת־מחדל __default__
  const targets: Targets =
    state.targetsByDate[dateISO] ||
    state.targetsByDate['__default__'] || { calories: 0, protein: 0 };

  // ארוחות של יום נוכחי + סכומים
  const dayMeals = useMemo(
    () => state.meals.filter((m) => m.dateISO === dateISO),
    [state.meals, dateISO]
  );
  const totals = useMemo(
    () => getTotalsForDate(state, dateISO),
    [state, dateISO]
  );

  // פלנר של השבוע הנוכחי
  const plan: WeeklyPlan = useMemo(
    () => getOrCreatePlan(state, weekStartISO),
    [state, weekStartISO]
  );

  // כרטיס השראה יומי — תמיד לפי תאריך היום האמיתי (לא לפי הדפדוף)
  const todayISOReal = toDateISO(new Date());
  const dailyQuote = getDailyQuote(todayISOReal);

  // === פעולות שמירה/עדכון ===
  const saveTargets = (t: Targets) =>
    setState((prev) => ({
      ...prev,
      targetsByDate: {
        ...prev.targetsByDate,
        __default__: { ...t },
        [dateISO]: { ...t },
      },
    }));

  const addMeal = (m: MealEntry) =>
    setState((prev) => ({ ...prev, meals: [m, ...prev.meals] }));

  const delMeal = (id: string) =>
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((x) => x.id !== id),
    }));

  const onPlanChange = (d: DayKey, slot: MealType, text: string) =>
    setState((prev) => {
      const next = structuredClone(prev);
      setPlanText(next, weekStartISO, d, slot, text);
      return next;
    });

  // בועה מהפלנר
  const onCellClick = (d: DayKey, slot: MealType, text: string) =>
    setBubble({ d, slot, text });

  const saveBubble = (text: string) => {
    if (!bubble) return;
    onPlanChange(bubble.d, bubble.slot, text);
    setBubble(null);
  };

  // היסטוריה (רק שבועות לפני השבוע הנוכחי)
  const historyWeeks = [...state.plans]
    .filter((p) => p.weekStartISO < weekStartISO)
    .sort((a, b) => (a.weekStartISO < b.weekStartISO ? 1 : -1));

  // שחזור שבוע היסטורי לתוך השבוע הנוכחי
  const askRestore = (fromWeek: string) =>
    setRestore({ open: true, from: fromWeek });

  const doRestore = () => {
    if (!restore.from) return;
    const src = state.plans.find((p) => p.weekStartISO === restore.from);
    if (!src) {
      setRestore({ open: false });
      return;
    }
    setState((prev) => {
      const next = structuredClone(prev);
      const cur = getOrCreatePlan(next, weekStartISO);
      cur.days = JSON.parse(JSON.stringify(src.days)); // deep clone
      return next;
    });
    setRestore({ open: false });
  };

  // ====================================================================

  return (
    <div>
      <Header onOpenSheet={() => setSheetOpen(true)} />

      <div className="content">
        {/* ---------------------- בית ---------------------- */}
        {tab === 'home' && (
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            {/* כרטיס השראה יומי */}
            <div className="card" style={{ background: '#fff7ed' }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>השראה יומית</div>
              <div>{dailyQuote}</div>
            </div>

            {/* יעדים יומיים */}
            <TargetEditor initial={targets} totals={totals} onSave={saveTargets} />

            {/* ארוחות יומיות */}
            <DayMeals
              dateISO={dateISO}
              meals={dayMeals}
              totals={totals}
              targets={targets}
              onChangeDate={setDateISO}
              onAdd={addMeal}
              onDelete={delMeal}
            />

            {/* בוחר תאריך מהיר */}
            <div className="card">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>בחירת יום</div>
              <MonthPicker value={dateISO} onChange={setDateISO} />
            </div>
          </div>
        )}

        {/* ------------------- תכנון ארוחות ------------------- */}
        {tab === 'calendar' && (
          <>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
              תכנון ארוחות – שבוע שמתחיל ב-{weekStartISO}
            </div>

            <PlannerGrid plan={plan} onCellClick={onCellClick} />

            {/* היסטוריית תכנון ארוחות */}
            <div className="card" style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                היסטוריית תכנון ארוחות
              </div>
              {historyWeeks.length === 0 && (
                <div className="muted">אין היסטוריה עדיין.</div>
              )}
              <div style={{ display: 'grid', gap: 8 }}>
                {historyWeeks.map((p) => (
                  <div
                    key={p.weekStartISO}
                    className="card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>{fmtRange(p.weekStartISO)}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn"
                        onClick={() =>
                          setEditingWeek((prev) =>
                            prev === p.weekStartISO ? null : p.weekStartISO
                          )
                        }
                      >
                        {editingWeek === p.weekStartISO ? 'סגור' : 'פתח'}
                      </button>
                      <button
                        className="btn"
                        onClick={() => askRestore(p.weekStartISO)}
                      >
                        שחזר
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {editingWeek && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>
                    צפייה/עריכה: {fmtRange(editingWeek)}
                  </div>
                  <PlannerGrid
                    plan={
                      state.plans.find((w) => w.weekStartISO === editingWeek)!}
                    onCellClick={(d, s, text) => setBubble({ d, slot: s, text })}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ---------------------- משקל ---------------------- */}
        {tab === 'weight' && (
          <WeightLog
            weights={state.weights}
            onAdd={(w) =>
              setState((prev) => ({ ...prev, weights: [w, ...prev.weights] }))
            }
          />
        )}
      </div>

      {/* רשימת קניות (SideSheet) */}
      <SideSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>רשימת קניות</div>
          <button
            className="btn"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                shopping: [
                  {
                    id:
                      crypto.randomUUID?.() ||
                      Math.random().toString(36).slice(2),
                    text: '',
                    done: false,
                  },
                  ...prev.shopping,
                ],
              }))
            }
          >
            הוסף פריט
          </button>
        </div>

        {state.shopping.length === 0 && (
          <div className="muted">התחל להוסיף פריטים…</div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {state.shopping.map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    shopping: prev.shopping.map((it) =>
                      it.id === item.id ? { ...it, done: !it.done } : it
                    ),
                  }))
                }
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  border: '1px solid #888',
                  background: item.done ? '#111827' : 'transparent',
                  color: item.done ? '#fff' : '#111',
                  cursor: 'pointer',
                }}
                aria-label={item.done ? 'סמן כלא בוצע' : 'סמן כבוצע'}
                title={item.done ? 'בטל סימון' : 'סמן בוצע'}
              >
                {item.done ? '✓' : ''}
              </button>

              <input
                className="input"
                style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}
                placeholder="פריט לקנייה"
                value={item.text}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    shopping: prev.shopping.map((it) =>
                      it.id === item.id ? { ...it, text: e.target.value } : it
                    ),
                  }))
                }
              />

              <button
                className="btn-danger"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    shopping: prev.shopping.filter((it) => it.id !== item.id),
                  }))
                }
              >
                מחק
              </button>
            </div>
          ))}
        </div>
      </SideSheet>

      {/* אישור שחזור */}
      <ConfirmModal
        open={restore.open}
        title="אישור שחזור"
        message={`האם לשחזר את התכנון מהתאריכים של השבוע ${
          restore.from ? fmtRange(restore.from) : ''
        }?`}
        onYes={doRestore}
        onNo={() => setRestore({ open: false })}
      />

      {/* בועת עריכת תא בפלנר */}
      <Bubble
        key={bubble ? `${bubble.d}-${bubble.slot}` : 'empty'}
        open={!!bubble}
        title={
          bubble
            ? `פרטי ארוחה • ${slotHeb[bubble.slot]} – יום ${dayHeb[bubble.d]}`
            : 'פרטי ארוחה'
        }
        text={bubble?.text || ''}
        onClose={() => setBubble(null)}
        onSave={saveBubble}
      />

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
