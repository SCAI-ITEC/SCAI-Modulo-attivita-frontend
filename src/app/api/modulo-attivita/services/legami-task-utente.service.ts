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

import { DeleteLegameResponse } from '../models/delete-legame-response';
import { Legame } from '../models/legame';
import { PostLegameBody } from '../models/post-legame-body';

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
    idTask?: number;
    idUtente?: number;
  },
  context?: HttpContext

): Observable<StrictHttpResponse<Array<Legame>>> {

    const rb = new RequestBuilder(this.rootUrl, LegamiTaskUtenteService.GetLegamiPath, 'get');
    if (params) {
      rb.query('idTask', params.idTask, {});
      rb.query('idUtente', params.idUtente, {});
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<Array<Legame>>;
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
    idTask?: number;
    idUtente?: number;
  },
  context?: HttpContext

): Observable<Array<Legame>> {

    return this.getLegami$Response(params,context).pipe(
      map((r: StrictHttpResponse<Array<Legame>>) => r.body as Array<Legame>)
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
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  postLegame$Response(params?: {
    body?: PostLegameBody
  },
  context?: HttpContext

): Observable<StrictHttpResponse<number>> {

    const rb = new RequestBuilder(this.rootUrl, LegamiTaskUtenteService.PostLegamePath, 'post');
    if (params) {
      rb.body(params.body, 'application/*+json');
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
   * To access the full response (for headers, for example), `postLegame$Response()` instead.
   *
   * This method sends `application/*+json` and handles request body of type `application/*+json`.
   */
  postLegame(params?: {
    body?: PostLegameBody
  },
  context?: HttpContext

): Observable<number> {

    return this.postLegame$Response(params,context).pipe(
      map((r: StrictHttpResponse<number>) => r.body as number)
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

): Observable<StrictHttpResponse<Legame>> {

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
        return r as StrictHttpResponse<Legame>;
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

): Observable<Legame> {

    return this.getLegame$Response(params,context).pipe(
      map((r: StrictHttpResponse<Legame>) => r.body as Legame)
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

): Observable<StrictHttpResponse<DeleteLegameResponse>> {

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
        return r as StrictHttpResponse<DeleteLegameResponse>;
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

): Observable<DeleteLegameResponse> {

    return this.deleteLegame$Response(params,context).pipe(
      map((r: StrictHttpResponse<DeleteLegameResponse>) => r.body as DeleteLegameResponse)
    );
  }

}
