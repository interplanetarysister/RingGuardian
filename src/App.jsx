import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AppShell from '@/components/layout/AppShell';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Packages from '@/pages/Packages';
import PackageDetail from '@/pages/PackageDetail';
import Scanners from '@/pages/Scanners';
import Cameras from '@/pages/Cameras';
import Evidence from '@/pages/Evidence';
import Investigations from '@/pages/Investigations';
import InvestigationDetail from '@/pages/InvestigationDetail';
import Logistics from '@/pages/Logistics';
import AiTracking from '@/pages/AiTracking';
import Interop from '@/pages/Interop';
import RingIntegration from '@/pages/RingIntegration';
import GuidedDemo from '@/pages/GuidedDemo';
import Alexa from '@/pages/Alexa';
import AmazonIntegration from '@/pages/AmazonIntegration';
import Operations from '@/pages/Operations';
import CustomerPortal from '@/pages/CustomerPortal';
import ManagementPortal from '@/pages/ManagementPortal';
import LiveEvents from '@/pages/LiveEvents';
import GuidedAssistant from '@/components/alexa/GuidedAssistant';
import About from '@/pages/About';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppShell />}>
        {['validation','alerts','activity','customer','connections','settings','monitoring'].map(path=><Route key={path} path={'/'+path} element={<Operations/>}/>)}
        <Route path="/customer-report" element={<CustomerPortal />} />
        <Route path="/management" element={<ManagementPortal />} />
        <Route path="/live-events" element={<LiveEvents />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/packages/:trackingNumber" element={<PackageDetail />} />
        <Route path="/scanners" element={<Scanners />} />
        <Route path="/cameras" element={<Cameras />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/investigations" element={<Investigations />} />
        <Route path="/investigations/:caseNumber" element={<InvestigationDetail />} />
        <Route path="/logistics" element={<Logistics />} />
        <Route path="/ai-tracking" element={<AiTracking />} />
        <Route path="/interop" element={<Interop />} />
        <Route path="/ring" element={<RingIntegration />} />
        <Route path="/amazon" element={<AmazonIntegration />} />
        <Route path="/alexa" element={<Alexa />} />
        <Route path="/guided-demo" element={<GuidedDemo />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
          <GuidedAssistant />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App