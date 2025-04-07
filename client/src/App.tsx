import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LicenseManager from "@/pages/LicenseManager";
import NuxiDevLicenses from "@/pages/NuxiDevLicenses";
import NuxiSavLicenses from "@/pages/NuxiSavLicenses";
import StudioLicenses from "@/pages/StudioLicenses";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/licenses/nuxidev" />} />
        <Route path="/licenses/nuxidev" component={NuxiDevLicenses} />
        <Route path="/licenses/nuxisav" component={NuxiSavLicenses} />
        <Route path="/licenses/studio" component={StudioLicenses} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
