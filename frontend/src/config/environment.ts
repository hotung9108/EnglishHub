import { developmentConfig } from './development';
import { stagingConfig } from './staging';
import { productionConfig } from './production';
import type { EnvironmentConfig } from './types';

const resolveEnvironment = (): EnvironmentConfig => {
  const mode = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.MODE : 'development';

  if (mode === 'production') {
    return productionConfig;
  }
  if (mode === 'staging') {
    return stagingConfig;
  }
  return developmentConfig;
};

const rawConfig = resolveEnvironment();

export const environment: EnvironmentConfig = Object.freeze({
  api: Object.freeze({ ...rawConfig.api }),
  app: Object.freeze({ ...rawConfig.app }),
  auth: Object.freeze({ ...rawConfig.auth }),
});

export default environment;
