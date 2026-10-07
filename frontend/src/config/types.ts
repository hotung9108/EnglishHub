export interface ApiConfig {
  readonly baseUrl: string;
  readonly timeout: number;
}

export interface AppConfig {
  readonly name: string;
  readonly version: string;
}

export interface AuthConfig {
  readonly accessTokenKey: string;
  readonly refreshTokenKey: string;
  readonly userKey: string;
}

export interface EnvironmentConfig {
  readonly api: ApiConfig;
  readonly app: AppConfig;
  readonly auth: AuthConfig;
}
