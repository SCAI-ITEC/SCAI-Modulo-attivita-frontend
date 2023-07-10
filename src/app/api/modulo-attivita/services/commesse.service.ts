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

import { GetCommessaResponse } from '../models/get-commessa-response';
import { GetCommesseResponse } from '../models/get-commesse-response';
import { PostCommessaBody } from '../models/post-commessa-body';

@Injectable({
  providedIn: 'root',
})
export class CommesseService extends BaseService {
  constructor(
    config: ApiConfiguration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Path part for operation getCommesse
   */
  static readonly GetCommessePath = '/commesse';

  /**
   * Recupera commesse e sottocommesse.
   *
   * **Parametri:**
   * <table>
   *     <tr><th>Nome</th><th>Descrizione</th></tr>
   *     <tr><td>Id</td>        <td>Commessa con l'id indicato.</td></tr>
   *     <tr><td>IdPadre</td>   <td>Sotto commesse del padre indicato.</td></tr>
   *     <tr><td>IdAzienda</td> <td>Commesse o sotto commesse collegate all'azienda indicata.</td></tr>
   *     <tr><td>Where</td>     <td>Lista di espressioni in <and> per filtrare i risultati (Es.: "<b>BusinessManager.Id</b> = 1097 and <b>CodiceCommessa</b> like "FE" and <b>ClienteFinale.Id</b> = 1744").</td></tr>
   *     <tr><td>OrderBy</td>   <td>Lista di espressioni per l'ordinamento dei risultati (Es.: "<b>IdCommessaPadre</b> asc, <b>Id</b> desc").</td></tr>
   * </table>
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getCommesse()` instead.
   *
   * This method doesn't expect any request body.
   */
  getCommesse$Response(params?: {
    Id?: number;
    IdPadre?: number;
    IdAzienda?: number;
    Where?: string;
    OrderBy?: string;
  },
  context?: HttpContext

): Observable<StrictHttpResponse<Array<GetCommesseResponse>>> {

    const rb = new RequestBuilder(this.rootUrl, CommesseService.GetCommessePath, 'get');
    if (params) {
      rb.query('Id', params.Id, {});
      rb.query('IdPadre', params.IdPadre, {});
      rb.query('IdAzienda', params.IdAzienda, {});
      rb.query('Where', params.Where, {});
      rb.query('OrderBy', params.OrderBy, {});
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<Array<GetCommesseResponse>>;
      })
    );
  }

  /**
   * Recupera commesse e sottocommesse.
   *
   * **Parametri:**
   * <table>
   *     <tr><th>Nome</th><th>Descrizione</th></tr>
   *     <tr><td>Id</td>        <td>Commessa con l'id indicato.</td></tr>
   *     <tr><td>IdPadre</td>   <td>Sotto commesse del padre indicato.</td></tr>
   *     <tr><td>IdAzienda</td> <td>Commesse o sotto commesse collegate all'azienda indicata.</td></tr>
   *     <tr><td>Where</td>     <td>Lista di espressioni in <and> per filtrare i risultati (Es.: "<b>BusinessManager.Id</b> = 1097 and <b>CodiceCommessa</b> like "FE" and <b>ClienteFinale.Id</b> = 1744").</td></tr>
   *     <tr><td>OrderBy</td>   <td>Lista di espressioni per l'ordinamento dei risultati (Es.: "<b>IdCommessaPadre</b> asc, <b>Id</b> desc").</td></tr>
   * </table>
   *
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `getCommesse$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getCommesse(params?: {
    Id?: number;
    IdPadre?: number;
    IdAzienda?: number;
    Where?: string;
    OrderBy?: string;
  },
  context?: HttpContext

): Observable<Array<GetCommesseResponse>> {

    return this.getCommesse$Response(params,context).pipe(
      map((r: StrictHttpResponse<Array<GetCommesseResponse>>) => r.body as Array<GetCommesseResponse>)
    );
  }

  /**
   * Path part for operation postCommessa
   */
  static readonly PostCommessaPath = '/commesse';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `postCommessa()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  postCommessa$Response(params?: {
    body?: PostCommessaBody
  },
  context?: HttpContext

): Observable<StrictHttpResponse<PostCommessaBody>> {

    const rb = new RequestBuilder(this.rootUrl, CommesseService.PostCommessaPath, 'post');
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
        return r as StrictHttpResponse<PostCommessaBody>;
      })
    );
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `postCommessa$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  postCommessa(params?: {
    body?: PostCommessaBody
  },
  context?: HttpContext

): Observable<PostCommessaBody> {

    return this.postCommessa$Response(params,context).pipe(
      map((r: StrictHttpResponse<PostCommessaBody>) => r.body as PostCommessaBody)
    );
  }

  /**
   * Path part for operation deleteSottoCommessa
   */
  static readonly DeleteSottoCommessaPath = '/commesse/{idSottoCommessa}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `deleteSottoCommessa()` instead.
   *
   * This method doesn't expect any request body.
   */
  deleteSottoCommessa$Response(params: {
    idSottoCommessa: number;
  },
  context?: HttpContext

): Observable<StrictHttpResponse<boolean>> {

    const rb = new RequestBuilder(this.rootUrl, CommesseService.DeleteSottoCommessaPath, 'delete');
    if (params) {
      rb.path('idSottoCommessa', params.idSottoCommessa, {});
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: String((r as HttpResponse<any>).body) === 'true' }) as StrictHttpResponse<boolean>;
      })
    );
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `deleteSottoCommessa$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  deleteSottoCommessa(params: {
    idSottoCommessa: number;
  },
  context?: HttpContext

): Observable<boolean> {

    return this.deleteSottoCommessa$Response(params,context).pipe(
      map((r: StrictHttpResponse<boolean>) => r.body as boolean)
    );
  }

  /**
   * Path part for operation getCommessa
   */
  static readonly GetCommessaPath = '/commesse/{id}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getCommessa()` instead.
   *
   * This method doesn't expect any request body.
   */
  getCommessa$Response(params: {
    id: number;
  },
  context?: HttpContext

): Observable<StrictHttpResponse<GetCommessaResponse>> {

    const rb = new RequestBuilder(this.rootUrl, CommesseService.GetCommessaPath, 'get');
    if (params) {
      rb.path('id', params.id, {});
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json',
      context: context
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<GetCommessaResponse>;
      })
    );
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `getCommessa$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getCommessa(params: {
    id: number;
  },
  context?: HttpContext

): Observable<GetCommessaResponse> {

    return this.getCommessa$Response(params,context).pipe(
      map((r: StrictHttpResponse<GetCommessaResponse>) => r.body as GetCommessaResponse)
    );
  }

}
