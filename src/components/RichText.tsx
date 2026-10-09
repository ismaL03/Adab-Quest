import { Fragment } from 'react';

const ARABIC = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF\\u200C\\u200D';
// Une suite de mots arabes (éventuellement séparés par des espaces / « · » / « + » / « = »).
const RUN = new RegExp(`([${ARABIC}]+(?:[\\s·+=]+[${ARABIC}]+)*)`, 'g');
const IS_ARABIC = new RegExp(`^[${ARABIC}]`);

/**
 * Affiche un texte français contenant de l’arabe : chaque passage arabe est
 * automatiquement composé dans la police coranique, en sens RTL.
 */
export function RichText({ text, arClassName = 'text-[1.3em]' }: { text: string; arClassName?: string }) {
  const parts = text.split(RUN);
  return (
    <>
      {parts.map((part, i) =>
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
