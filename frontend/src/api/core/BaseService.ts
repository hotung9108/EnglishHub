import type {
  IHttpClient,
  ICrudService,
  IReadService,
  IWriteService,
  PageResult,
  PaginationParams,
  RequestConfig,
} from '../../types/api.types';
import { httpClient } from './BaseHttpClient';

/**
 * Abstract BaseService providing core HTTP communication and endpoint routing.
 * Adheres to Single Responsibility (SRP) and Open/Closed (OCP) principles.
 */
export abstract class BaseService {
  protected readonly http: IHttpClient;
  public readonly baseEndpoint: string;

  constructor(baseEndpoint: string, client: IHttpClient = httpClient) {
    this.baseEndpoint = baseEndpoint.replace(/\/+$/, '');
    this.http = client;
  }

  /**
   * Constructs full URL path relative to the baseEndpoint.
   */
  protected buildUrl(path?: string | number): string {
    if (path === undefined || path === null || path === '') {
      return this.baseEndpoint;
    }
    const cleanPath = String(path).replace(/^\/+/, '');
    return `${this.baseEndpoint}/${cleanPath}`;
  }

  /**
   * Sanitizes query parameters by stripping undefined, null, or empty string values.
   */
  protected cleanParams<P extends Record<string, unknown>>(params?: P): Record<string, unknown> | undefined {
    if (!params) return undefined;
    const cleaned: Record<string, unknown> = {};

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleaned[key] = val;
      }
    });

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
}

/**
 * Generic Base CRUD Service implementing standard RESTful operations:
 * - getAll (with pagination & query filtering)
 * - getById
 * - create
 * - update
 * - patch
 * - delete
 *
 * Implements Interface Segregation (IReadService, IWriteService, ICrudService).
 */
export class BaseCrudService<
    T,
    TCreateDto = Partial<T>,
    TUpdateDto = Partial<T>,
    TParams extends PaginationParams = PaginationParams
  >
  extends BaseService
  implements
    ICrudService<T, TCreateDto, TUpdateDto, TParams>,
    IReadService<T, TParams>,
    IWriteService<T, TCreateDto, TUpdateDto>
{
  /**
   * Retrieves paginated or complete collection of items.
   */
  public async getAll(params?: TParams, config?: RequestConfig): Promise<PageResult<T> | T[]> {
    const cleanedParams = this.cleanParams(params);
    return this.http.get<PageResult<T> | T[]>(this.buildUrl(), {
      ...config,
      params: cleanedParams,
    });
  }

  /**
   * Retrieves a single entity by its unique ID.
   */
  public async getById(id: string | number, config?: RequestConfig): Promise<T> {
    return this.http.get<T>(this.buildUrl(id), config);
  }

  /**
   * Creates a new entity.
   */
  public async create(dto: TCreateDto, config?: RequestConfig): Promise<T> {
    return this.http.post<T, TCreateDto>(this.buildUrl(), dto, config);
  }

  /**
   * Fully updates an existing entity (PUT).
   */
  public async update(id: string | number, dto: TUpdateDto, config?: RequestConfig): Promise<T> {
    return this.http.put<T, TUpdateDto>(this.buildUrl(id), dto, config);
  }

  /**
   * Partially updates an existing entity (PATCH).
   */
  public async patch(id: string | number, dto: Partial<TUpdateDto>, config?: RequestConfig): Promise<T> {
    return this.http.patch<T, Partial<TUpdateDto>>(this.buildUrl(id), dto, config);
  }

  /**
   * Deletes an entity by ID.
   */
  public async delete(id: string | number, config?: RequestConfig): Promise<boolean> {
    await this.http.delete<void>(this.buildUrl(id), config);
    return true;
  }
}
