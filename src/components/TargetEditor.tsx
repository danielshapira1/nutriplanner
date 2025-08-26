import React from 'react';
import type { Targets } from '../types';

export default function TargetEditor({
  initial,
  totals,
  onSave,
}: {
  initial: Targets;
  totals: { calories: number; protein: number };
  onSave: (t: Targets) => void;
}) {
  const [values, setValues] = React.useState<Targets>(initial);
  // אם זה שימוש ראשוני (שני היעדים 0) – פותחים במצב עריכה
  const initialIsEmpty = !initial?.calories && !initial?.protein;
  const [editMode, setEditMode] = React.useState<boolean>(initialIsEmpty);

  React.useEffect(() => {
    setValues(initial);
    // אם הגיעו יעדים חדשים/מאופסים, עדכן מצב עריכה בהתאם
    const empty = !initial?.calories && !initial?.protein;
    setEditMode((prev) => (empty ? true : prev));
  }, [initial]);

  const save = () => {
    onSave(values);
    setEditMode(false);
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800 }}>יעדים יומיים</div>

      {/* מצב עריכה: מציג שדות להזנת יעדים */}
      {editMode ? (
        <>
          <div className="grid2">
            <label style={{ display: 'grid', gap: 4 }}>
              <span>קלוריות</span>
              <input
                className="input"
                inputMode="numeric"
                value={values.calories}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    calories: Number(e.target.value) || 0,
                  }))
                }
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>חלבון (גרם)</span>
              <input
                className="input"
                inputMode="numeric"
                value={values.protein}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    protein: Number(e.target.value) || 0,
                  }))
                }
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={save}>
              שמור
            </button>
          </div>
        </>
      ) : (
        // מצב תצוגה: מציג קוביות מודגשות בלבד + כפתור עדכון יעדים
        <>
          <div
            style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            {/* קלוריות — תכלת */}
            <div
              style={{
                background: '#e0f2fe', // sky-100
                border: '2px solid rgba(14, 165, 233, 0.5)', // sky-500 @ 50%
                borderRadius: 12,
                padding: '12px 8px',
                textAlign: 'center',
                fontWeight: 700,
                lineHeight: 1.25,
              }}
            >
              <div>סה״כ קלוריות</div>
              <div style={{ fontSize: 20 }}>{totals.calories}</div>
              <div>מתוך יעד</div>
              <div style={{ fontSize: 20 }}>{values.calories}</div>
            </div>

            {/* חלבון — סגול */}
            <div
              style={{
                background: '#ede9fe', // violet-100
                border: '2px solid rgba(139, 92, 246, 0.5)', // violet-500 @ 50%
                borderRadius: 12,
                padding: '12px 8px',
                textAlign: 'center',
                fontWeight: 700,
                lineHeight: 1.25,
              }}
            >
              <div>סה״כ חלבון</div>
              <div style={{ fontSize: 20 }}>{totals.protein}</div>
              <div>מתוך יעד</div>
              <div style={{ fontSize: 20 }}>{values.protein}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={() => setEditMode(true)}>
              עדכן יעדים
            </button>
          </div>
        </>
      )}
    </div>
  );
}
