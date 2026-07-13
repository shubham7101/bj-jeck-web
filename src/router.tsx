import { Route as rootRoute } from "./routes/__root";
import { Route as BillsBillIdRoute } from "./routes/bills/$billId";
import { Route as BillsIndexRoute } from "./routes/bills/index";
import { Route as BillsNewRoute } from "./routes/bills/new";
import { Route as CustomerBalancesRoute } from "./routes/customer-balances";
import { Route as CustomerRatesRoute } from "./routes/customer-rates";
import { Route as CustomersCustomerIdRoute } from "./routes/customers/$customerId";
import { Route as CustomersIndexRoute } from "./routes/customers/index";
import { Route as CustomersNewRoute } from "./routes/customers/new";
import { Route as CustomersUpdateCustomerIdRoute } from "./routes/customers/update.$customerId";
import { Route as IndexRoute } from "./routes/index";
import { Route as InventoryIndexRoute } from "./routes/inventory/index";
import { Route as InventoryUpdateRoute } from "./routes/inventory/update";
import { Route as LedgerIndexRoute } from "./routes/ledger/index";
import { Route as LedgerNewRoute } from "./routes/ledger/new";
import { Route as RecordsRecordIdRoute } from "./routes/records/$recordId";
import { Route as RecordsIndexRoute } from "./routes/records/index";
import { Route as RecordsNewRoute } from "./routes/records/new";
import { Route as RecordsUpdateRecordIdRoute } from "./routes/records/update.$recordId";
import { Route as SitesSiteIdRoute } from "./routes/sites/$siteId";
import { Route as SitesIndexRoute } from "./routes/sites/index";
import { Route as SitesNewRoute } from "./routes/sites/new";
import { Route as SitesStatementSiteIdRoute } from "./routes/sites/statement.$siteId";
import { Route as SitesUnbilledRoute } from "./routes/sites/unbilled";
import { Route as SitesUpdateSiteIdRoute } from "./routes/sites/update.$siteId";

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  CustomerRatesRoute,
  CustomerBalancesRoute,
  RecordsIndexRoute,
  LedgerIndexRoute,
  InventoryIndexRoute,
  SitesIndexRoute,
  CustomersIndexRoute,
  BillsIndexRoute,
  RecordsNewRoute,
  RecordsRecordIdRoute,
  LedgerNewRoute,
  InventoryUpdateRoute,
  SitesUnbilledRoute,
  CustomersNewRoute,
  CustomersCustomerIdRoute,
  BillsNewRoute,
  BillsBillIdRoute,
  RecordsUpdateRecordIdRoute,
  CustomersUpdateCustomerIdRoute,
  SitesStatementSiteIdRoute,
  SitesSiteIdRoute,
  SitesNewRoute,
  SitesUpdateSiteIdRoute,
]);

import { createRouter } from "@tanstack/react-router";

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
