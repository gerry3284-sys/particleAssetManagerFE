import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GraphService } from '../services/graph.service';

@Injectable()
export class GraphTokenInterceptor implements HttpInterceptor {

  constructor(private graphService: GraphService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const graphToken = this.graphService.getGraphToken();

    if (graphToken && req.url.includes('localhost:8080')) {
      req = req.clone({
        setHeaders: {
          'X-Graph-Token': graphToken
        }
      });
    }

    return next.handle(req);
  }
}