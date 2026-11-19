import type { AvatarGroupItem } from './AvatarGroup';

interface PortraitColors {
  /** The two ends of the background's gradient, top then bottom. */
  backgroundTop: string;
  backgroundBottom: string;
  skin: string;
  clothing: string;
}

/**
 * A small head-and-shoulders drawing as a data URI, so a story shows photos with no network
 * request. Each one is a flat-colour portrait on a gradient, drawn to the edge of its square like
 * a cropped photo is: the pixels meet the avatar's edge, which is where a forced-colours outline
 * has to separate one photo from the next.
 */
function portrait({ backgroundTop, backgroundBottom, skin, clothing }: PortraitColors): string {
  const drawing =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${backgroundTop}"/>` +
    `<stop offset="1" stop-color="${backgroundBottom}"/>` +
    `</linearGradient></defs>` +
    `<rect width="96" height="96" fill="url(#g)"/>` +
    `<ellipse cx="48" cy="100" rx="38" ry="30" fill="${clothing}"/>` +
    `<circle cx="48" cy="40" r="17" fill="${skin}"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(drawing)}`;
}

/**
 * Six people with a photo each, from a pale picture to a near-black one, so a group of them puts
 * light against dark and mid against mid. The names and ids are `AvatarGroup`'s story people.
 * Excluded from the dist (`rslib.config.ts`).
 */
export const photoPeople: readonly AvatarGroupItem[] = [
  {
    id: 'uid-1',
    name: 'Ada Lovelace',
    colorSeed: 'uid-1',
    src: portrait({
      backgroundTop: '#F6EBD9',
      backgroundBottom: '#E4CFAE',
      skin: '#C48A6A',
      clothing: '#2E4057',
    }),
  },
  {
    id: 'uid-2',
    name: 'Grace Hopper',
    colorSeed: 'uid-2',
    src: portrait({
      backgroundTop: '#1B2A4A',
      backgroundBottom: '#0B1220',
      skin: '#8D5B3E',
      clothing: '#E6E8EE',
    }),
  },
  {
    id: 'uid-3',
    name: 'Katherine Johnson',
    colorSeed: 'uid-3',
    src: portrait({
      backgroundTop: '#3BA99C',
      backgroundBottom: '#1F6F66',
      skin: '#E0A97F',
      clothing: '#264653',
    }),
  },
  {
    id: 'uid-4',
    name: 'Margaret Hamilton',
    colorSeed: 'uid-4',
    src: portrait({
      backgroundTop: '#F08A6C',
      backgroundBottom: '#C2553A',
      skin: '#F1C7A5',
      clothing: '#3D2B3D',
    }),
  },
  {
    id: 'uid-5',
    name: 'Annie Easley',
    colorSeed: 'uid-5',
    src: portrait({
      backgroundTop: '#DDE5D8',
      backgroundBottom: '#B7C4B0',
      skin: '#6F4330',
      clothing: '#354F52',
    }),
  },
  {
    id: 'uid-6',
    name: 'Mary Jackson',
    colorSeed: 'uid-6',
    src: portrait({
      backgroundTop: '#34364A',
      backgroundBottom: '#16171F',
      skin: '#B57B5A',
      clothing: '#D9A441',
    }),
  },
];
