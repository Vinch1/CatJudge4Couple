import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JoinPage from "./pages/JoinPage";
import EvidencePage from "./pages/EvidencePage";
import WaitingRoom from "./pages/WaitingRoom";
import Courtroom from "./pages/Courtroom";
import VerdictPage from "./pages/VerdictPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/case/:caseId/join" element={<JoinPage />} />
        <Route path="/case/:caseId/evidence" element={<EvidencePage />} />
        <Route path="/case/:caseId/waiting" element={<WaitingRoom />} />
        <Route path="/case/:caseId/courtroom" element={<Courtroom />} />
        <Route path="/case/:caseId/verdict" element={<VerdictPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
