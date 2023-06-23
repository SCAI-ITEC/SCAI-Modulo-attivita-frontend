/* tslint:disable */
/* eslint-disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpContext } from '@angular/common/http';
import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';
import { RequestBuilder } from '../request-builder';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { GetLegameResponse } from '../models/get-legame-response';
import { GetLegamiResponse } from '../models/get-legami-response';
import { PostLegameBody } from '../models/post-legame-body';
import { PostLegameResponse } from '../models/post-legame-response';

@Injectable({
  providedIn: 'root',
})
export class LegamiTaskUtenteService extends BaseService {
  constructor(
    config: ApiConfiguration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Path part for operation getLegami
   */
  static readonly GetLegamiPath = '/legami-tasks-utenti';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getLegami()` instead.
   *
   * This method doesn't expect any request body.
   */
  getLegami$Response(params?: {
    idLegame?: number;
    idTask?: number;
    idUtente?: number;
    idAzienda?: number;
  },
  context?: HttpContext

): Observable<StrictHttpResponse<Array<GetLegamiResponse>>> {

    const rb = new RequestBuilder(this.rootUrl, LegamiTaskUtenteService.GetLegamiPath, 'get');
    if (params) {
      rb.query('idLegame', params.idLegame, {});
      rb.query('idTask', params.idTask, {});
      rb.query('idUtente', params.idUtente, {});
      rb.query('idAzienda', params.idAzienda, {});
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<Array<GetLegamiResponse>>;
      })
    );
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `getLegami$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getLegami(params?: {
    idLegame?: number;
    idTask?: number;
    idUtente?: number;
    idAzienda?: number;
  },
  context?: HttpContext

): Observable<Array<GetLegamiResponse>> {

    return this.getLegami$Response(params,context).pipe(
      map((r: StrictHttpResponse<Array<GetLegamiResponse>>) => r.body as Array<GetLegamiResponse>)
    );
  }

  /**
   * Path part for operation postLegame
   */
  static readonly PostLegamePath = '/legami-tasks-utenti';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `postLegame()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  postLegame$Response(params?: {
    body?: PostLegameBody
  },
  context?: HttpContext

): Observable<StrictHttpResponse<PostLegameResponse>> {

    const rb = new RequestBuilder(this.rootUrl, LegamiTaskUtenteService.PostLegamePath, 'post');
    if (params) {
      rb.body(params.body, 'application/json');
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<PostLegameResponse>;
      })
    );
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `postLegame$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  postLegame(params?: {
    body?: PostLegameBody
  },
  context?: HttpContext

): Observable<PostLegameResponse> {

    return this.postLegame$Response(params,context).pipe(
      map((r: StrictHttpResponse<PostLegameResponse>) => r.body as PostLegameResponse)
    );
  }

  /**
   * Path part for operation getLegame
   */
  static readonly GetLegamePath = '/legami-tasks-utenti/{idLegame}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getLegame()` instead.
   *
   * This method doesn't expect any request body.
   */
  getLegame$Response(params: {
    idLegame: number;
  },
  context?: HttpContext

): Observable<StrictHttpResponse<GetLegameResponse>> {

    const rb = new RequestBuilder(this.rootUrl, LegamiTaskUtenteService.GetLegamePath, 'get');
    if (params) {
      rb.path('idLegame', params.idLegame, {});
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<GetLegameResponse>;
      })
    );
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `getLegame$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getLegame(params: {
    idLegame: number;
  },
  context?: HttpContext

): Observable<GetLegameResponse> {

    return this.getLegame$Response(params,context).pipe(
      map((r: StrictHttpResponse<GetLegameResponse>) => r.body as GetLegameResponse)
    );
  }

  /**
   * Path part for operation deleteLegame
   */
  static readonly DeleteLegamePath = '/legami-tasks-utenti/{idLegame}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deleteLegame()` instead.
   *
   * This method doesn't expect any request body.
   */
  deleteLegame$Response(params: {
    idLegame: number;
  },
  context?: HttpContext

): Observable<StrictHttpResponse<number>> {

    const rb = new RequestBuilder(this.rootUrl, LegamiTaskUtenteService.DeleteLegamePath, 'delete');
    if (params) {
      rb.path('idLegame', params.idLegame, {});
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: parseFloat(String((r as HttpResponse<any>).body)) }) as StrictHttpResponse<number>;
      })
    );
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deleteLegame$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  deleteLegame(params: {
    idLegame: number;
  },
  context?: HttpContext

): Observable<number> {

    return this.deleteLegame$Response(params,context).pipe(
      map((r: StrictHttpResponse<number>) => r.body as number)
    );
  }

}
