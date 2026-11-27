import { z } from 'zod';
import { LIMITS, LORES_BY_REALM, loreSchema, realmSchema } from '@admin/shared/api';

const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label}은(는) ${max}자 이하로 적어 주세요.`);
const required = (max: number, label: string) =>
  text(max, label).min(1, `${label}을(를) 입력해 주세요.`);
const coordinate = (min: number, max: number, label: string) =>
  z
    .number({ error: `${label}를 숫자로 입력해 주세요.` })
    .min(min, `${label}는 ${min}~${max} 사이입니다.`)
    .max(max, `${label}는 ${min}~${max} 사이입니다.`);

/** 앱 카탈로그와 같은 ID 형식(영문 소문자·숫자·하이픈) */
export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ID는 영문 소문자·숫자와 하이픈(-)으로 적어 주세요.')
  .max(64, 'ID는 64자 이하입니다.');

export const destinationFormSchema = z
  .object({
    id: slugSchema,
    realm: realmSchema,
    lore: loreSchema,
    name: required(LIMITS.destinationName, '이름'),
    originalName: text(LIMITS.originalName, '원어 이름'),
    tagline: required(LIMITS.tagline, '한 줄 소개'),
    group: required(LIMITS.group, '묶음'),
    location: text(LIMITS.location, '지역'),
    era: text(LIMITS.era, '시대'),
    latitude: coordinate(-90, 90, '위도'),
    longitude: coordinate(-180, 180, '경도'),
    overview: text(LIMITS.overview, '소개'),
  })
  .refine((value) => LORES_BY_REALM[value.realm].includes(value.lore), {
    path: ['lore'],
    message: '실존 유적은 역사·사실, 환상 세계는 신화·전설 중에서 고릅니다.',
  });

export type DestinationFormValues = z.infer<typeof destinationFormSchema>;
