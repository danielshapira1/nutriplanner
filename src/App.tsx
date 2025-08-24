import React, { useEffect, useMemo, useState } from 'react';
import type {
  PersistShape,
  MealEntry,
  Targets,
  DayKey,
  MealType,
  TabKey,
} from './types';
import { toDateISO, sundayOfWeek } from './lib/dates';
import { loadState, saveState } from './lib/persist';
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

// תרגום ימי השבוע וסוגי הארוחות לכותרת הבועה
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

export default function App(): JSX.Element {
  const [state, setState] = useState<PersistShape>(() => loadState());

  // שמירת נתונים רק לחצי שנה אחורה (ארוחות/שקילות/פלנרים)
  useEffect(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 183); // ~ חצי שנה
    const cutISO = toDateISO(cutoff);
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.dateISO >= cutISO),
      weights: prev.weights.filter((w) => w.dateISO >= cutISO),
      plans: prev.plans.filter(
        (p) => p.weekStartISO >= toDateISO(sundayOfWeek(cutoff))
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => saveState(state), [state]);

  const [tab, setTab] = useState<TabKey>('home');
  const [dateISO, setDateISO] = useState<string>(toDateISO(new Date()));
  const weekStartISO = toDateISO(sundayOfWeek(new Date(dateISO)));
  const [sheetOpen, setSheetOpen] = useState(false);

  const [restore, setRestore] = useState<{ open: boolean; from?: string }>({
    open: false,
  });
  const [bubble, setBubble] = useState<BubbleState>(null);
  const [editingWeek, setEditingWeek] = useState<string | null>(null);

  // יעדים: ברירת מחדל '__default__' אם אין יעד יומי ספציפי
  const targets =
    state.targetsByDate[dateISO] ||
    state.targetsByDate['__default__'] || { calories: 0, protein: 0 };

  const dayMeals = useMemo(
    () => state.meals.filter((m) => m.dateISO === dateISO),
    [state.meals, dateISO]
  );
  const totals = useMemo(
    () => getTotalsForDate(state, dateISO),
    [state, dateISO]
  );
  const plan = useMemo(
    () => getOrCreatePlan(state, weekStartISO),
    [state, weekStartISO]
  );

  // יעד יומי: שמירה כיעד ברירת־מחדל + יעד לתאריך הנוכחי
  const saveTargets = (t: Targets) =>
    setState((prev) => ({
      ...prev,
      targetsByDate: {
        ...prev.targetsByDate,
        __default__: { ...t },
        [dateISO]: { ...t },
      },
    }));

  // ארוחות יומיות
  const addMeal = (m: MealEntry) =>
    setState((prev) => ({ ...prev, meals: [m, ...prev.meals] }));
  const delMeal = (id: string) =>
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((x) => x.id !== id),
    }));

  // פלנר שבועי: שינוי תא דרך הבועה
  const onPlanChange = (d: DayKey, slot: MealType, text: string) =>
    setState((prev) => {
      const next = structuredClone(prev);
      setPlanText(next, weekStartISO, d, slot, text);
      return next;
    });

  // פתיחת בועה בלחיצה על תא בפלנר
  const onCellClick = (d: DayKey, slot: MealType, text: string) =>
    setBubble({ d, slot, text });

  // שמירת טקסט מהבועה
  const saveBubble = (text: string) => {
    if (!bubble) return;
    onPlanChange(bubble.d, bubble.slot, text);
    setBubble(null);
  };

  // היסטוריה: רק שבועות לפני השבוע הנוכחי
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
      // deep copy
      cur.days = JSON.parse(JSON.stringify(src.days));
      return next;
    });
    setRestore({ open: false });
  };

  return (
    <div>
      <Header onOpenSheet={() => setSheetOpen(true)} />

      <div className="content">
        {/* בית: יעדים + יומן יומי + לוח חודש */}
        {tab === 'home' && (
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <TargetEditor initial={targets} totals={totals} onSave={saveTargets} />
            <DayMeals
              dateISO={dateISO}
              meals={dayMeals}
              totals={totals}
              targets={targets}
              onChangeDate={setDateISO}
              onAdd={addMeal}
              onDelete={delMeal}
            />
            <div className="card">
              <div style={{ fontWeight: 800, marginBottom: 6 }}>בחירת יום</div>
              <MonthPicker value={dateISO} onChange={setDateISO} />
            </div>
          </div>
        )}

        {/* תכנון ארוחות (לוח שבועי) + היסטוריה */}
        {tab === 'calendar' && (
          <>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
              תכנון ארוחות – שבוע שמתחיל ב-{weekStartISO}
            </div>
            <PlannerGrid plan={plan} onCellClick={onCellClick} />

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
                      <button className="btn" onClick={() => askRestore(p.weekStartISO)}>
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
                    plan={state.plans.find((w) => w.weekStartISO === editingWeek)!}
                    onCellClick={(d, s, text) => setBubble({ d, slot: s, text })}
                  />
                </div>
              )}
            </div>
          </>
        )}

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

      {/* אישור שחזור היסטוריה */}
      <ConfirmModal
        open={restore.open}
        title="אישור שחזור"
        message={`האם לשחזר את התכנון מהתאריכים של השבוע ${
          restore.from ? fmtRange(restore.from) : ''
        }?`}
        onYes={doRestore}
        onNo={() => setRestore({ open: false })}
      />

      {/* בועה: שמתי key ייחודי לפי התא כדי לאפס מצב בכל מעבר תא */}
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
