import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProjectProvider } from './contexts/ProjectContext'
import TaskList from './pages/TaskList'
import TaskCreate from './pages/TaskCreate'
import HTMLGenerator from './pages/HTMLGenerator'
import BadgeTool from './pages/BadgeTool'
import URLGenerator from './pages/URLGenerator'
import LPHeatmap from './pages/LPHeatmap'
import ThumbnailABTest from './pages/ThumbnailABTest'
import CompetitorAnalysis from './pages/CompetitorAnalysis'
import Settings from './pages/Settings'

function App() {
    return (
        <ProjectProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<TaskList />} />
                    <Route path="/task-create" element={<TaskCreate />} />
                    <Route path="/html-generator" element={<HTMLGenerator />} />
                    <Route path="/badge-tool" element={<BadgeTool />} />
                    <Route path="/url-generator" element={<URLGenerator />} />
                    <Route path="/lp-heatmap" element={<LPHeatmap />} />
                    <Route path="/thumbnail-ab" element={<ThumbnailABTest />} />
                    <Route path="/competitor-analysis" element={<CompetitorAnalysis />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </BrowserRouter>
        </ProjectProvider>
    )
}

export default App
