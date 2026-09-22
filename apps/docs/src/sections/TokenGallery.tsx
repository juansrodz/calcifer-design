import { breakpoint, shared, toKebab, type ThemeName } from '@calcifer-design/tokens';
import { Tag } from '@calcifer-design/ui';
import {
  contrastPairRows,
  swatchRows,
  THEME_NAMES,
  type SwatchRow,
} from '../tokens/contrast-table';
import styles from '../styles/docs.module.css';

interface RampProps {
  themeName: ThemeName;
}

function Ramp({ themeName }: RampProps) {
  return (
    <div className={styles.ramp}>
      <h4 className={styles.rampHeading}>{themeName}</h4>
      <ul className={styles.swatches}>
        {swatchRows(themeName).map((swatch: SwatchRow) => (
          <li className={styles.swatch} key={`${themeName}-${swatch.name}`} data-testid="swatch">
            {/* The literal token value, not a var(): this renders the dark ramp faithfully on a
                light page and the light ramp on a dark one, which is the whole point. */}
            <span className={styles.swatchChip} style={{ background: swatch.value }} />
            <span className={styles.swatchName}>{swatch.name}</span>
            <span className={styles.swatchValue}>{swatch.value}</span>
            <span className={styles.swatchValue}>
              {swatch.luminance === undefined ? '—' : swatch.luminance.toFixed(3)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TokenGallery() {
  const rows = contrastPairRows();
  return (
    <section className={styles.section} aria-labelledby="tokens-heading">
      <h2 className={styles.sectionHeading} id="tokens-heading">
        Tokens, as artifacts
      </h2>
      <p className={styles.lede}>
        Every colour, size and duration in the library is a design token, exported twice: as CSS
        custom properties for stylesheets, and as plain JavaScript values. Everything below is
        computed from the second export in your browser, right now — nothing here is a picture of
        the tokens, and nothing here can be out of date.
      </p>

      <h3 className={styles.subHeading}>Colour, in both themes</h3>
      <div className={styles.ramps}>
        {THEME_NAMES.map((themeName) => (
          <Ramp key={themeName} themeName={themeName} />
        ))}
      </div>

      <h3 className={styles.subHeading}>Contrast</h3>
      <p className={styles.note}>
        Computed with the same <code className={styles.code}>contrastRatio</code> the tokens package
        tests with: 4.5:1 for text (WCAG 1.4.3), 3:1 for non-text UI (1.4.11), in every theme.{' '}
        {rows.length} declared pairs.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>Contrast of every declared token pair</caption>
          <thead>
            <tr>
              <th scope="col">Pair</th>
              <th scope="col">Kind</th>
              <th scope="col">Light</th>
              <th scope="col">Dark</th>
              <th scope="col">Needs</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.kind}-${row.foreground}-${row.background}`}>
                <th scope="row" className={styles.pairCell}>
                  {row.foreground} on {row.background}
                </th>
                <td>{row.kind}</td>
                <td>{row.ratios.light.toFixed(2)}</td>
                <td>{row.ratios.dark.toFixed(2)}</td>
                <td>{row.threshold.toFixed(1)}</td>
                <td>
                  <Tag tone={row.passes ? 'accent' : 'neutral'}>{row.passes ? 'Pass' : 'Fail'}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={styles.subHeading}>Type scale</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>The type scale</caption>
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Value</th>
              <th scope="col">Sample</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(shared.text).map(([name, value]) => (
              <tr key={name}>
                <th scope="row" className={styles.pairCell}>
                  --text-{toKebab(name)}
                </th>
                <td className={styles.swatchValue}>{value}</td>
                <td style={{ fontSize: value }}>Portfolio</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={styles.subHeading}>Spacing</h3>
      <ul className={styles.spaceList}>
        {Object.entries(shared.space).map(([name, value]) => (
          <li className={styles.spaceRow} key={name}>
            <span className={styles.swatchName}>--space-{toKebab(name)}</span>
            <span className={styles.swatchValue}>{value}</span>
            <span className={styles.spaceBar} style={{ width: value }} />
          </li>
        ))}
      </ul>

      <h3 className={styles.subHeading}>Breakpoints</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>Breakpoints</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">min-width</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(breakpoint).map(([name, value]) => (
              <tr key={name}>
                <th scope="row" className={styles.pairCell}>
                  {name}
                </th>
                <td className={styles.swatchValue}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
