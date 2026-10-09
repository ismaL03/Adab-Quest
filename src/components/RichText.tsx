import { Fragment } from 'react';

const ARABIC = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF\\u200C\\u200D';
// Une suite de mots arabes (éventuellement séparés par des espaces / « · » / « + » / « = »).
const RUN = new RegExp(`([${ARABIC}]+(?:[\\s·+=]+[${ARABIC}]+)*)`, 'g');
const IS_ARABIC = new RegExp(`^[${ARABIC}]`);

/**
 * Affiche un texte français contenant de l’arabe : chaque passage arabe est
 * automatiquement composé dans la police coranique, en sens RTL.
 * Les passages entre **doubles astérisques** sont mis en valeur.
 */
export function RichText({ text, arClassName = 'text-[1.3em]' }: { text: string; arClassName?: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((segment, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-ink">
            <Runs text={segment} arClassName={arClassName} />
          </strong>
        ) : (
          <Runs key={i} text={segment} arClassName={arClassName} />
        ),
      )}
    </>
  );
}

function Runs({ text, arClassName }: { text: string; arClassName: string }) {
  return (
    <>
      {text.split(RUN).map((part, i) =>
        part && IS_ARABIC.test(part) ? (
          <span key={i} dir="rtl" lang="ar" className={`font-quran inline-block ${arClassName}`} style={{ lineHeight: 1.25 }}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
