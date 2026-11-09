/* ═══════════════════════════════════════════════════════════════════════
   Commutateur jour / nuit
   ═══════════════════════════════════════════════════════════════════════

   TROIS ÉTATS, PAS DEUX. « Système » est le défaut et doit le rester : un
   téléphone qui bascule en sombre le soir emmène le site avec lui, sans
   qu'on ait rien demandé. Le réduire à un interrupteur obligerait chacun
   à choisir une fois pour toutes, et à revenir le corriger deux fois par
   jour. On garde donc le choix de NE PAS choisir.

   LE CHOIX TIENT SUR CE NAVIGATEUR, et nulle part ailleurs : un thème est
   une préférence d'affichage, pas une donnée de compte. Le stocker côté
   serveur ferait voyager un réglage local entre des écrans qui n'ont rien
   à voir — et demanderait une session pour une case à cocher.

   LE SCINTILLEMENT SE RÈGLE AVANT REACT. L'attribut est posé par un petit
   script dans `index.html`, exécuté avant le premier tracé : sans lui, la
   page s'affiche une fraction de seconde dans le mauvais thème, et ce
   clignotement blanc est pire que pas de mode sombre du tout.
   ═══════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { C, F, btn } from "./data.tsx";
import { useLangue } from "./i18n.tsx";

export type Theme = "systeme" | "jour" | "nuit";

export const CLE_THEME = "beyrey:theme";

/** Lit le choix mémorisé. Tolère un stockage refusé (navigation privée,
 *  cookies bloqués) : on retombe alors sur « système », qui marche
 *  toujours. */
export function themeMemorise(): Theme {
  try {
    const v = localStorage.getItem(CLE_THEME);
    return v === "jour" || v === "nuit" ? v : "systeme";
  } catch {
    return "systeme";
  }
}

/** Pose le thème sur la racine. « système » RETIRE l'attribut : c'est
 *  l'absence qui rend la main à `prefers-color-scheme`, pas une valeur
 *  particulière. */
export function appliquerTheme(theme: Theme): void {
  const racine = document.documentElement;
  if (theme === "systeme") racine.removeAttribute("data-theme");
  else racine.setAttribute("data-theme", theme);
  try {
    if (theme === "systeme") localStorage.removeItem(CLE_THEME);
    else localStorage.setItem(CLE_THEME, theme);
  } catch {
    /* Stockage refusé : le thème s'applique quand même, il ne survivra
       simplement pas au rechargement. Mieux que de ne rien faire. */
  }
}

/* `invitation` est la phrase qui mène VERS cet état, pas celle qui le
 * décrit. Elle est écrite en entier plutôt que composée d'un verbe et
 * d'un nom : « passer au thème clair » et « passer à la sombra » ne se
 * recollent pas de la même façon d'une langue à l'autre, et l'arabe
 * encore moins. Trois phrases coûtent moins cher qu'un gabarit faux. */
const ETATS: { valeur: Theme; icone: string; libelle: string; invitation: string }[] = [
  { valeur: "systeme", icone: "◐", libelle: "Thème du système",
    invitation: "Cliquer pour passer au thème du système." },
  { valeur: "jour", icone: "☀", libelle: "Thème clair",
    invitation: "Cliquer pour passer au thème clair." },
  { valeur: "nuit", icone: "☾", libelle: "Thème sombre",
    invitation: "Cliquer pour passer au thème sombre." },
];

export function CommutateurTheme({ compact = false }: { compact?: boolean }) {
  const { t } = useLangue();
  const [theme, setTheme] = useState<Theme>(themeMemorise);

  useEffect(() => { appliquerTheme(theme); }, [theme]);

  const actuel = ETATS.find(e => e.valeur === theme) ?? ETATS[0];
  const suivant = ETATS[(ETATS.indexOf(actuel) + 1) % ETATS.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(suivant.valeur)}
      // CE QUE FAIT LE BOUTON, pas ce qu'il affiche : un lecteur d'écran
      // qui annonce « thème sombre » sans dire que le clic l'ACTIVE laisse
      // croire que c'est l'état courant.
      aria-label={`${t(actuel.libelle)}. ${t(suivant.invitation)}`}
      title={t(actuel.libelle)}
      style={btn({
        background: "none",
        color: C.t2,
        border: `1px solid ${C.bdr}`,
        borderRadius: 10,
        // 40 px au minimum : sous ce seuil, la cible se rate au doigt.
        minWidth: 40,
        minHeight: 40,
        padding: compact ? "0 10px" : "0 12px",
        fontSize: 15,
        fontFamily: F.sans,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      })}
    >
      <span aria-hidden="true">{actuel.icone}</span>
      {!compact && (
        <span style={{ fontSize: 11, fontFamily: F.mono, letterSpacing: ".06em" }}>
          {actuel.valeur === "systeme" ? "AUTO" : actuel.valeur.toUpperCase()}
        </span>
      )}
    </button>
  );
}
