import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const apiKey = environment.apikey;

    // Clone the request and set the new header
    let clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${apiKey}` 
      }
    });

     // Check if the request is a POST request and has a JSON body
    if (clonedRequest.method === 'POST' && clonedRequest.body) {
      if (typeof clonedRequest.body === 'object') {
        clonedRequest = clonedRequest.clone({
          body: {
            ...clonedRequest.body,
            apikey: apiKey // Add the API key to the payload
          }
        });
      }
    }

    return next.handle(clonedRequest);
  }
}
