import { breakpoint, shared, toKebab, type ThemeName } from '@calcifer-design/tokens';
import { Tag } from '@calcifer-design/ui';
import type { ReactNode } from 'react';
import { contrastPairRows, swatchRows, THEME_NAMES } from '../tokens/contrast-table';
import styles from '../styles/docs.module.css';

interface TokenTableProps {
  caption: string;
  columns: readonly string[];
  children: ReactNode;
}

/** This page's table shell: one scroll container, a visible caption, one header row. */
function TokenTable({ caption, columns, children }: TokenTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface RampProps {
  themeName: ThemeName;
}

function Ramp({ themeName }: RampProps) {
  return (
    <div className={styles.ramp}>
      <h4 className={styles.rampHeading}>{themeName}</h4>
      <ul className={styles.swatches}>
        {swatchRows(themeName).map((swatch) => (
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
      <TokenTable
        caption="Contrast of every declared token pair"
        columns={['Pair', 'Kind', 'Light', 'Dark', 'Needs', 'Result']}
      >
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
      </TokenTable>

      <h3 className={styles.subHeading}>Type scale</h3>
      <TokenTable caption="The type scale" columns={['Token', 'Value', 'Sample']}>
        {Object.entries(shared.text).map(([name, value]) => (
          <tr key={name}>
            <th scope="row" className={styles.pairCell}>
              --text-{toKebab(name)}
            </th>
            <td className={styles.swatchValue}>{value}</td>
            <td style={{ fontSize: value }}>Portfolio</td>
          </tr>
        ))}
      </TokenTable>

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
      <TokenTable caption="Breakpoints" columns={['Name', 'min-width']}>
        {Object.entries(breakpoint).map(([name, value]) => (
          <tr key={name}>
            <th scope="row" className={styles.pairCell}>
              {name}
            </th>
            <td className={styles.swatchValue}>{value}</td>
          </tr>
        ))}
      </TokenTable>
    </section>
  );
}
