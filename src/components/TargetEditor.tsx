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
    <div className="card" style={{ display: 'grid', gap: 8 }}>
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

      <div>
        <strong>
          סה״כ קלוריות {totals.calories} מתוך יעד {values.calories}
        </strong>
      </div>
      <div>
        <strong>
          סה״כ חלבון {totals.protein} מתוך יעד {values.protein}
        </strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={save}>
          שמור
        </button>
      </div>
    </div>
  );
}
