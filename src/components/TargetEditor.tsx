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

  React.useEffect(() => {
    setValues(initial);
  }, [initial]);

  const save = () => {
    onSave(values);
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800 }}>יעדים יומיים</div>

      <div className="grid2">
        <label style={{ display: 'grid', gap: 4 }}>
          <span>קלוריות</span>
          <input
            className="input"
            inputMode="numeric"
            value={values.calories}
            onChange={(e) =>
              setValues((v) => ({ ...v, calories: Number(e.target.value) || 0 }))
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
              setValues((v) => ({ ...v, protein: Number(e.target.value) || 0 }))
            }
          />
        </label>
      </div>

      {/* קוביות מודגשות עם סיכומי היום */}
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <div
          style={{
            background: '#fef3c7',
            border: '2px solid rgba(245, 158, 11, 0.5)', // כתום 50% אטימות
            borderRadius: 12,
            padding: '12px 8px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          סה״כ קלוריות {totals.calories} <br /> מתוך יעד {values.calories}
        </div>
        <div
          style={{
            background: '#d1fae5',
            border: '2px solid rgba(16, 185, 129, 0.5)', // ירוק 50% אטימות
            borderRadius: 12,
            padding: '12px 8px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          סה״כ חלבון {totals.protein} <br /> מתוך יעד {values.protein}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={save}>
          שמור
        </button>
      </div>
    </div>
  );
}
