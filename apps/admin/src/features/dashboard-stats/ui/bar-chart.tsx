import { useId, useState } from 'react';
import { formatNumber } from '@admin/shared/lib';
import type { DailyCount } from '../model/stats';

const short = (day: string) => day.slice(5).replace('-', '.');

/**
 * 한 계열 막대 그래프(범례 없음, 제목이 계열 이름). 막대는 먹색, 가장 최근 날만 붉은색으로 강조합니다.
 * 막대에 마우스를 올리거나 초점을 두면 값이 보이고, 같은 내용을 표로도 엽니다.
 */
export function BarChart({
  title,
  unit,
  data,
}: {
  title: string;
  unit: string;
  data: DailyCount[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const max = Math.max(1, ...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const width = 600;
  const height = 180;
  const gap = 2;
  const bar = width / data.length - gap;
  const current = active === null ? null : data[active];

  return (
    <figure className="chart">
      <figcaption className="chart__caption">
        <span className="chart__title">{title}</span>
        <span className="chart__total">
          {formatNumber(total)}
          <small>{unit}</small>
        </span>
      </figcaption>
      <p className="chart__readout" aria-hidden="true">
        {current
          ? `${short(current.day)} · ${formatNumber(current.count)}${unit}`
          : `최근 ${data.length}일`}
      </p>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${width} ${height + 20}`}
        role="img"
        aria-label={`${title}, 최근 ${data.length}일 합계 ${total}${unit}. 아래 표에서 날짜별 값을 볼 수 있습니다.`}
      >
        <line x1="0" x2={width} y1={height} y2={height} className="chart__axis" />
        {data.map((item, index) => {
          const h = Math.max(item.count ? 3 : 0, (item.count / max) * (height - 8));
          const x = index * (bar + gap);
          const last = index === data.length - 1;
          return (
            <g
              key={item.day}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            >
              {/* 막대보다 넓은 투명 영역으로 마우스를 받습니다. */}
              <rect x={x} y={0} width={bar + gap} height={height} fill="transparent" />
              <path
                className={`chart__bar${last ? ' chart__bar--accent' : ''}${active === index ? ' is-active' : ''}`}
                d={`M${x},${height} v${-Math.max(0, h - 2)} q0,-2 2,-2 h${Math.max(0, bar - 4)} q2,0 2,2 v${Math.max(0, h - 2)} z`}
              />
            </g>
          );
        })}
        <text x="0" y={height + 16} className="chart__tick">
          {short(data[0]?.day ?? '')}
        </text>
        <text x={width} y={height + 16} textAnchor="end" className="chart__tick">
          {short(data[data.length - 1]?.day ?? '')}
        </text>
      </svg>
      <details className="chart__table">
        <summary>{title} 표로 보기</summary>
        <table id={tableId}>
          <caption className="visually-hidden">{title} 날짜별 값</caption>
          <thead>
            <tr>
              <th scope="col">날짜</th>
              <th scope="col">{unit === '명' ? '인원' : '개수'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.day}>
                <th scope="row">{item.day}</th>
                <td>{formatNumber(item.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
