import { useId, useState, type Ref } from 'react';
import type { Destination } from '@admin/shared/api';
import { Button } from '@admin/shared/ui';

/** 코스에 담은 여행지 순서를 고칩니다. 위·아래로 옮기고 빼고 더합니다. */
export function StopsEditor({
  value,
  onChange,
  destinations,
  error,
  describedBy,
  inputId,
  selectRef,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  destinations: Destination[];
  error?: string;
  describedBy?: string;
  inputId: string;
  selectRef?: Ref<HTMLSelectElement>;
}) {
  const [candidate, setCandidate] = useState('');
  const listId = useId();
  const nameOf = (id: string) => destinations.find((item) => item.id === id)?.name ?? id;
  const move = (index: number, offset: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (item === undefined) return;
    next.splice(index + offset, 0, item);
    onChange(next);
  };
  const options = destinations.filter((item) => !value.includes(item.id));

  return (
    <div className="stops">
      <ol className="stops__list" id={listId} aria-label="코스에 담은 여행지">
        {value.map((id, index) => (
          <li key={id} className="stops__item">
            <span className="stops__index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="stops__name">{nameOf(id)}</span>
            <span className="stops__tools">
              <Button
                variant="line"
                aria-label={`${nameOf(id)} 위로`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                위로
              </Button>
              <Button
                variant="line"
                aria-label={`${nameOf(id)} 아래로`}
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                아래로
              </Button>
              <Button
                variant="line"
                aria-label={`${nameOf(id)} 빼기`}
                onClick={() => onChange(value.filter((stop) => stop !== id))}
              >
                빼기
              </Button>
            </span>
          </li>
        ))}
      </ol>
      <div className="stops__add">
        <select
          id={inputId}
          ref={selectRef}
          className="input"
          value={candidate}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => setCandidate(event.target.value)}
        >
          <option value="">더할 여행지 고르기</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Button
          variant="bracket"
          disabled={!candidate}
          onClick={() => {
            onChange([...value, candidate]);
            setCandidate('');
          }}
        >
          여행지 더하기
        </Button>
      </div>
    </div>
  );
}
