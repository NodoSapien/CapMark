import { IonIcon } from '@ionic/react';
import { star, starOutline, starHalf } from 'ionicons/icons';

interface Props {
  value: number; // 0 to 5
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly = false }: Props) {
  const handleClick = (index: number) => {
    if (readonly || !onChange) return;
    
    // We can allow half stars by calculating where the user clicked, 
    // but for a simple visual star rating, clicking a star usually sets it to that integer value.
    // Let's implement a simple integer star rating first. If the user clicks the same star again, maybe reset or decrease?
    // A common approach is clicking a star sets it. Clicking the same star if it was the only one might reset it.
    if (value === index + 1) {
      onChange(0);
    } else {
      onChange(index + 1);
    }
  };

  return (
    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = value - i;
        let icon = starOutline;
        if (fill >= 1) icon = star;
        else if (fill >= 0.5) icon = starHalf;

        return (
          <IonIcon
            key={i}
            icon={icon}
            style={{
              fontSize: '24px',
              color: 'var(--ion-color-warning, #ffc409)',
              cursor: readonly ? 'default' : 'pointer',
            }}
            onClick={() => handleClick(i)}
          />
        );
      })}
    </div>
  );
}
