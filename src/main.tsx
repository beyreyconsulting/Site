import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import App from './App.tsx';
import { FournisseurLangue } from './i18n.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Les animations framer-motion suivent le réglage « réduire les
        animations » du système : la règle CSS ne les atteint pas. */}
    <MotionConfig reducedMotion="user">
      {/* Version allégée de framer-motion (composants `m.*`). `strict` fait
          échouer tout `motion.*` complet qui réapparaîtrait : il ramènerait
          ~30 Ko de plus sur des connexions mobiles lentes. */}
      <LazyMotion features={domAnimation} strict>
        {/* La langue enveloppe tout : elle pose aussi `dir` sur la
            racine, dont dependent toutes les proprietes logiques. */}
        <FournisseurLangue>
          <App />
        </FournisseurLangue>
      </LazyMotion>
    </MotionConfig>
  </StrictMode>
);
