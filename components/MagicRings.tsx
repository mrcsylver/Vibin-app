import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { RING_FEET } from '../utils/constants';

type Props = {
  size: number;
};

/** Concentric fantasy rings at 100 / 200 / 300 ft. */
export function MagicRings({ size }: Props) {
  const c = size / 2;
  const maxR = size / 2 - 8;
  const colors = ['#BA68C8', '#64B5F6', '#81C784'];

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="meadowGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.9" />
          <Stop offset="70%" stopColor="#C8E6C9" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#E0F7FA" stopOpacity="0.1" />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={maxR} fill="url(#meadowGlow)" />
      {RING_FEET.map((feet, index) => {
        const r = (feet / 300) * maxR;
        return (
          <Circle
            key={feet}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={colors[index]}
            strokeWidth={index === 2 ? 2.4 : 1.6}
            strokeDasharray={index === 1 ? '3 8' : '1 7'}
            strokeOpacity={0.75}
          />
        );
      })}
      <Circle cx={c} cy={c} r={10} fill="none" stroke="#F8BBD0" strokeWidth={1.5} strokeOpacity={0.8} />
    </Svg>
  );
}
