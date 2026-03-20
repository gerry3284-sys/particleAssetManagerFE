# Particle Asset Manager FE

Frontend Angular per la gestione del ciclo di vita degli asset aziendali (creazione, assegnazione, riconsegna, dismissione), con UI standalone components e integrazione REST verso backend locale.

## Obiettivo Del Progetto

L'app permette di:
- visualizzare e filtrare gli asset;
- creare nuovi asset;
- vedere il dettaglio asset e storico movimenti;
- eseguire workflow operativi (assegnazione, certificazione riconsegna, dismissione);
- amministrare alcune anagrafiche (es. AssetStatusType).

## Stack Tecnologico

- Angular `21` (standalone components)
- TypeScript `5.9`
- RxJS `7.8`
- Angular SSR configurato (`@angular/ssr`)
- Express (runtime SSR build)
- Bootstrap presente nelle dipendenze
- Package manager: `npm`

## Quick Start

Prerequisiti:
- Node.js LTS
- npm
- Backend raggiungibile su `http://localhost:8080`

Comandi principali:

```bash
npm install
npm start
```

Altri script:

```bash
npm run build
npm run watch
npm run test
npm run serve:ssr:particleAssetManagerFE
```

## Configurazione

File ambiente principale:
- `src/app/features/environment.ts`

Valori attuali:
- `production: false`
- `apiUrl: http://localhost:8080`

Nota: parte dei servizi usa endpoint hardcoded su `http://localhost:8080` invece di leggere sempre `environment.apiUrl`.

## Architettura Applicativa

Entry point:
- `src/main.ts` -> bootstrap `App` con `appConfig`
- `src/app/app.ts` -> root minimale con `<router-outlet>`

Configurazione provider:
- `src/app/app.config.ts`
- Router
- HttpClient con `withFetch()`
- Client hydration

Layout principali:
- `AuthLayoutComponent` per autenticazione (`/login`)
- `MainLayoutComponent` per area principale con sidebar
- `UserLayoutComponent` per area utente standard

## Routing (Mappa)

Definito in `src/app/app.routes.ts`.

Rotte principali:
- `/login`
- `/assets`
- `/assets/new`
- `/assets/:assetCode`
- `/asset-types`
- `/businessUnits`
- `/users`
- `/users/user-detail/:id`
- `/user-standard/:id`
- `/404`

Fallback:
- wildcard `**` -> `/404`

## Albero Cartelle (Rilevante)

```text
particleAssetManagerFE/
  angular.json
  package.json
  public/
    assets/
  src/
    main.ts
    styles.css
    app/
      app.ts
      app.config.ts
      app.config.server.ts
      app.routes.ts
      app.routes.server.ts

      core/
        layout/
          auth-layout/
          main-layout/
          user-layout/

      features/
        environment.ts

        assets/
          pages/
            asset-list/
            asset-create/
            asset-detail/
          components/
            create-asset-status-type-modal/
            return-certify-modal/
          services/

        auth/
          login/

        errors/
          pages/
            not-found/

        users/
          pages/
            user-list/

        user-detail/
        area-user/
          user-standard/

        asset-type-list/
        business-unit/

      shared/
        components/
          sidebar/
          button/
          dropdown/
          dropdown-search/
          filters/
          pagination/
          popup-message/
          assign-asset-modal/
          dismiss-asset-modal/
        models/
          asset.interface.ts
          filter-config.interface.ts
          dropdown-option.interface.ts
        services/
          asset.service.ts
          filter.service.ts
          asset-workflow.service.ts
          popup-message.service.ts
          asset-type.service.ts
          business-unit.service.ts

      services/
        api.ts
      models/
        user.model.ts
```

## Modello Dati Principale

`shared/models/asset.interface.ts`:
- `Asset` (lista)
- `AssetDetail` (dettaglio)
- `AssetMovement`
- `AssignAssetForm`
- `AssetCreateForm`

Stati gestiti lato FE:
- `Assigned`
- `Available`
- `Dismissed`
- `Unavailable`

## Servizi E Integrazione API

### `AssetService`
File: `src/app/shared/services/asset.service.ts`

Responsabilita:
- lista asset
- dettaglio asset
- movimenti asset
- creazione asset
- creazione movimento
- update asset
- update status asset

Endpoint usati:
- `GET  /asset/list`
- `GET  /asset/{assetCode}`
- `GET  /asset/{assetCode}/movement`
- `POST /asset`
- `POST /asset/{assetCode}/movement`
- `PUT  /asset/{assetCode}`
- `PUT  /asset/updateAssetStatus/{assetCode}`

Dettagli importanti:
- normalizzazione `assetCode` con trim + encodeURIComponent (`toSafeAssetCode`)
- mapping robusto dello status backend (`parseStatus`) da code/label

### `FilterService`
File: `src/app/shared/services/filter.service.ts`

Endpoint usati:
- `GET  /user`
- `GET  /assetType`
- `GET  /businessUnit`
- `GET  /assetStatusType`
- `POST /assetStatusType`

Note:
- `getAssetStatusTypes()` usa cache con `shareReplay(1)`.

### `AssetWorkflowService`
File: `src/app/shared/services/asset-workflow.service.ts`

Orchestra i workflow creando movimenti su asset:
- assegnazione (`Assigned`)
- riconsegna (`Returned`)
- dismissione (`Dismissed`)

## UI System Condiviso

Componenti base riusabili:
- `app-button` (`primary`, `secondary`, `danger`, `login`, `sidebar`)
- `app-dropdown`
- `app-dropdown-search`

Notifiche globali:
- `PopupMessageService`
- `app-popup-message` montato in `MainLayoutComponent`
- tipi: `success`, `error`
- sostituisce gli `alert(...)` browser nelle pagine principali asset

## Workflow Funzionali (Stato Attuale)

### Asset List
- filtro per tipologia, BU, stato, assegnatario
- menu `Nuovo` con:
  - Nuovo Asset
  - Nuova Tipologia (placeholder)
  - Creazione AssetStatusType (implementata)

### Asset Create
- form reattivo
- campi condizionali RAM/HardDisk in base alla tipologia
- modale di conferma pre-submit
- invio a backend con payload normalizzato

### Asset Detail
- mostra anagrafica e movimenti
- modale assegnazione
- modale certificazione riconsegna
- modale dismissione
- refresh dettaglio + movimenti dopo ogni azione

## Note Su Struttura E Debito Tecnico

- Coesistono moduli legacy in `src/app/services` e `src/app/models` oltre a `shared/services` e `shared/models`.
- Non tutti i servizi leggono base URL da `environment`.
- Le modali condividono stile simile ma sono implementate come componenti distinti (possibile futura estrazione in modal shell generica).

## Testing E Qualita

- Comando test: `npm run test`
- File esempio: `src/app/app.spec.ts`
- Molte logiche sono oggi coperte soprattutto da test manuale su UI/workflow.

## Guida Rapida Per AI/Copilot

Se devi modificare una feature, usa questa mappa:

- Routing globale: `src/app/app.routes.ts`
- Layout e shell pagina: `src/app/core/layout/**`
- Lista asset: `src/app/features/assets/pages/asset-list/*`
- Creazione asset: `src/app/features/assets/pages/asset-create/*`
- Dettaglio asset e azioni: `src/app/features/assets/pages/asset-detail/*`
- Modali asset: `src/app/features/assets/components/*` e `src/app/shared/components/*-modal/*`
- API asset: `src/app/shared/services/asset.service.ts`
- API lookup/filter: `src/app/shared/services/filter.service.ts`
- Workflow business (assegna/ritorna/dismetti): `src/app/shared/services/asset-workflow.service.ts`
- Messaggi popup globali: `src/app/shared/services/popup-message.service.ts` + `src/app/shared/components/popup-message/*`
- Tipi shared: `src/app/shared/models/*`

Checklist prima di fare modifiche:
- verificare route coinvolta;
- verificare se esiste un componente shared gia riusabile;
- verificare mapping API in `asset.service.ts`;
- preferire popup message invece di `alert(...)`;
- testare su viewport desktop e mobile.

## Convenzioni Pratiche Del Repo

- Standalone components Angular (no NgModule classici)
- Stato locale spesso con `signal`/`computed`
- Form principalmente Reactive Forms
- Commenti in italiano/inglese misti (mantenere coerenza nella stessa area)

## Possibili Prossimi Passi

- Implementare realmente `Nuova Tipologia` con modale + endpoint `POST /assetType`
- Estrarre una `modal-shell` condivisa per ridurre duplicazioni
- Uniformare tutti i servizi su `environment.apiUrl`
- Aumentare copertura test su workflow asset
